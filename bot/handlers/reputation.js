import { pool } from '../services/database.js';
import { formatDistanceToNow } from 'date-fns';
import ruLocale from 'date-fns/locale/ru/index.js';

// Store cooldowns and daily limits in memory
const reputationCooldowns = new Map();
const dailyReputationCount = new Map();

export const handleReputation = async (ctx) => {
  try {
    // Check if it's a reply with reputation trigger
    if (!ctx.message?.reply_to_message || !ctx.message.text) return;
    
    const text = ctx.message.text.toLowerCase();
    const triggers = ['+реп', '+rep', '+', 'спасибо', 'thanks', 'спс', 'благодарю'];
    
    const isReputationMessage = triggers.some(trigger => {
      if (trigger === '+') {
        return text === trigger;
      }
      return text.includes(trigger);
    });
    
    if (!isReputationMessage) return;
    
    const giverId = ctx.from.id;
    const receiverId = ctx.message.reply_to_message.from.id;
    
    // Can't give reputation to yourself
    if (giverId === receiverId) {
      return ctx.reply('❌ Нельзя повышать репутацию самому себе!');
    }
    
    // Can't give reputation to bots
    if (ctx.message.reply_to_message.from.is_bot) {
      return ctx.reply('❌ Нельзя давать репутацию ботам!');
    }
    
    // Check cooldown (8 hours)
    const lastGiven = reputationCooldowns.get(giverId);
    if (lastGiven) {
      const hoursSinceLastGiven = (Date.now() - lastGiven) / (1000 * 60 * 60);
      if (hoursSinceLastGiven < 8) {
        const hoursLeft = Math.ceil(8 - hoursSinceLastGiven);
        const minutesLeft = Math.ceil((8 - hoursSinceLastGiven) * 60);
        
        let timeMessage = '';
        if (hoursLeft >= 1) {
          timeMessage = `${hoursLeft} ${hoursLeft === 1 ? 'час' : hoursLeft < 5 ? 'часа' : 'часов'}`;
        } else {
          timeMessage = `${minutesLeft} ${minutesLeft === 1 ? 'минуту' : minutesLeft < 5 ? 'минуты' : 'минут'}`;
        }
        
        return ctx.reply(`⏳ Ты сможешь выдать репутацию через ${timeMessage}`);
      }
    }
    
    // Check daily limit for receiver (10 per day)
    const receiverDailyKey = `${receiverId}_${new Date().toDateString()}`;
    const dailyCount = dailyReputationCount.get(receiverDailyKey) || 0;
    if (dailyCount >= 10) {
      return ctx.reply('❌ Этот пользователь уже получил максимум репутации за сутки!');
    }
    
    const connection = await pool.getConnection();
    try {
      // Ensure users exist in database
      await ensureUser(connection, giverId, ctx.from);
      await ensureUser(connection, receiverId, ctx.message.reply_to_message.from);
      
      // Update reputation
      await connection.execute(
        'UPDATE users SET reputation = reputation + 1 WHERE telegram_id = ?',
        [receiverId]
      );
      
      // Log reputation
      await connection.execute(
        `INSERT INTO reputation_logs (giver_id, receiver_id) 
         SELECT u1.id, u2.id FROM users u1, users u2 
         WHERE u1.telegram_id = ? AND u2.telegram_id = ?`,
        [giverId, receiverId]
      );
      
      // Get updated reputation
      const [rows] = await connection.execute(
        'SELECT reputation FROM users WHERE telegram_id = ?',
        [receiverId]
      );
      
      const newReputation = rows[0].reputation;
      
      // Update cooldowns
      reputationCooldowns.set(giverId, Date.now());
      dailyReputationCount.set(receiverDailyKey, dailyCount + 1);
      
      // Send success message
      const giverName = ctx.from.first_name || ctx.from.username || 'Аноним';
      const receiverName = ctx.message.reply_to_message.from.first_name || 
                          ctx.message.reply_to_message.from.username || 'Аноним';
      
      ctx.reply(
        `✨ ${giverName} повысил репутацию на +1 ${receiverName}!\n` +
        `Теперь у чувака ${newReputation} репутации 🔥`,
        { reply_to_message_id: ctx.message.reply_to_message.message_id }
      );
      
      // Check for achievements
      await checkAchievements(connection, receiverId, newReputation, ctx);
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Reputation error:', error);
    ctx.reply('❌ Произошла ошибка при выдаче репутации');
  }
};

// Ensure user exists in database
async function ensureUser(connection, telegramId, userData) {
  const [existing] = await connection.execute(
    'SELECT id FROM users WHERE telegram_id = ?',
    [telegramId]
  );
  
  if (existing.length === 0) {
    await connection.execute(
      `INSERT INTO users (telegram_id, username, first_name, last_name) 
       VALUES (?, ?, ?, ?)`,
      [
        telegramId,
        userData.username || null,
        userData.first_name || null,
        userData.last_name || null
      ]
    );
  } else {
    // Update user info
    await connection.execute(
      `UPDATE users SET 
       username = ?, first_name = ?, last_name = ?, last_active = CURRENT_TIMESTAMP
       WHERE telegram_id = ?`,
      [
        userData.username || null,
        userData.first_name || null,
        userData.last_name || null,
        telegramId
      ]
    );
  }
}

// Check for reputation achievements
async function checkAchievements(connection, telegramId, reputation, ctx) {
  const milestones = [10, 25, 50, 100, 250, 500, 1000];
  
  if (milestones.includes(reputation)) {
    const [users] = await connection.execute(
      'SELECT first_name, username FROM users WHERE telegram_id = ?',
      [telegramId]
    );
    
    const name = users[0].first_name || users[0].username || 'Пользователь';
    
    let achievement = '';
    switch(reputation) {
      case 10: achievement = '🌟 Новичок (10 реп.)'; break;
      case 25: achievement = '⭐ Активист (25 реп.)'; break;
      case 50: achievement = '🏆 Звезда (50 реп.)'; break;
      case 100: achievement = '💯 Сотка (100 реп.)'; break;
      case 250: achievement = '🎯 Мастер (250 реп.)'; break;
      case 500: achievement = '👑 Легенда (500 реп.)'; break;
      case 1000: achievement = '🔥 БОГ ДВИЖА (1000 реп.)'; break;
    }
    
    ctx.reply(
      `🎉 ПОЗДРАВЛЯЕМ! 🎉\n\n` +
      `${name} получает достижение:\n` +
      `${achievement}\n\n` +
      `Так держать, движняк! 🔥`
    );
  }
}

// Reset daily limits
export const resetDailyLimits = async () => {
  dailyReputationCount.clear();
  console.log('✅ Daily reputation limits reset');
};