import { Markup } from 'telegraf';
import { pool } from '../services/database.js';
import crypto from 'crypto';

// Store auth sessions temporarily
const authSessions = new Map();

export const handleStart = async (ctx) => {
  try {
    const startParam = ctx.message.text.split(' ')[1];
    
    if (startParam && startParam.startsWith('auth_')) {
      // This is an auth request from website
      const sessionId = startParam.replace('auth_', '');
      
      // Request contact
      await ctx.reply(
        '👋 Добро пожаловать в DVIZH BISHKEK!\n\n' +
        '📱 Для авторизации на сайте поделитесь своим контактом:',
        Markup.keyboard([
          [Markup.button.contactRequest('📱 Поделиться контактом')]
        ]).resize()
      );
      
      // Store session
      authSessions.set(ctx.from.id, {
        sessionId,
        timestamp: Date.now()
      });
    } else {
      // Regular start
      await ctx.reply(
        '🔥 Добро пожаловать в DVIZH BISHKEK BOT! 🔥\n\n' +
        'Используйте команды:\n' +
        '/top - Топ движняков\n' +
        '/stats - Твоя статистика\n' +
        '/event - Ближайшие события\n' +
        '/help - Помощь'
      );
    }
  } catch (error) {
    console.error('Start command error:', error);
  }
};

export const handleContact = async (ctx) => {
  try {
    if (!ctx.message.contact) return;
    
    const { phone_number, user_id } = ctx.message.contact;
    
    // Check if this user has auth session
    const session = authSessions.get(ctx.from.id);
    if (!session) {
      return ctx.reply('❌ Сессия авторизации не найдена. Начните заново с сайта.');
    }
    
    // Remove keyboard
    await ctx.reply('✅ Контакт получен! Проверяем подписки...', Markup.removeKeyboard());
    
    // Check subscriptions
    const groupId = process.env.TELEGRAM_GROUP_ID;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    const [isGroupMember, isChatMember] = await Promise.all([
      checkChatMember(ctx, groupId, user_id),
      checkChatMember(ctx, chatId, user_id)
    ]);
    
    if (!isGroupMember || !isChatMember) {
      // Show subscription buttons
      const keyboard = [];
      
      if (!isGroupMember) {
        keyboard.push([
          Markup.button.url('📢 Подписаться на группу', process.env.TELEGRAM_GROUP_LINK)
        ]);
      }
      
      if (!isChatMember) {
        keyboard.push([
          Markup.button.url('💬 Вступить в чат', process.env.TELEGRAM_CHAT_LINK)
        ]);
      }
      
      keyboard.push([
        Markup.button.callback('✅ Я подписался', 'check_subscription')
      ]);
      
      await ctx.reply(
        '❗ Для доступа к сайту необходимо:\n\n' +
        (!isGroupMember ? '📢 Подписаться на группу DVIZH\n' : '') +
        (!isChatMember ? '💬 Вступить в чат DVIZH\n' : '') +
        '\nПосле подписки нажмите кнопку "Я подписался"',
        Markup.inlineKeyboard(keyboard)
      );
      
      // Store phone number for later
      session.phoneNumber = phone_number;
      authSessions.set(ctx.from.id, session);
    } else {
      // User is subscribed, create auth token
      await createAuthToken(ctx, phone_number, session.sessionId);
    }
  } catch (error) {
    console.error('Contact handler error:', error);
    ctx.reply('❌ Произошла ошибка. Попробуйте снова.');
  }
};

export const handleCheckSubscription = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const session = authSessions.get(ctx.from.id);
    if (!session) {
      return ctx.reply('❌ Сессия авторизации истекла. Начните заново с сайта.');
    }
    
    // Check subscriptions again
    const groupId = process.env.TELEGRAM_GROUP_ID;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    const [isGroupMember, isChatMember] = await Promise.all([
      checkChatMember(ctx, groupId, ctx.from.id),
      checkChatMember(ctx, chatId, ctx.from.id)
    ]);
    
    if (!isGroupMember || !isChatMember) {
      await ctx.reply(
        '❌ Вы еще не подписались на все каналы!\n\n' +
        (!isGroupMember ? '📢 Нужно подписаться на группу\n' : '') +
        (!isChatMember ? '💬 Нужно вступить в чат\n' : '')
      );
    } else {
      await createAuthToken(ctx, session.phoneNumber, session.sessionId);
    }
  } catch (error) {
    console.error('Check subscription error:', error);
    ctx.reply('❌ Произошла ошибка. Попробуйте снова.');
  }
};

async function createAuthToken(ctx, phoneNumber, sessionId) {
  try {
    const connection = await pool.getConnection();
    
    try {
      // Check if user exists
      const [existing] = await connection.execute(
        'SELECT * FROM users WHERE telegram_id = ?',
        [ctx.from.id]
      );
      
      let userId;
      let user;
      
      if (existing.length === 0) {
        // Get user photos if available
        let avatarUrl = null;
        try {
          const photos = await ctx.telegram.getUserProfilePhotos(ctx.from.id, 0, 1);
          if (photos.total_count > 0) {
            const fileId = photos.photos[0][0].file_id;
            const fileUrl = await ctx.telegram.getFileLink(fileId);
            avatarUrl = fileUrl.href;
          }
        } catch (err) {
          console.log('Could not get user avatar:', err);
        }
        
        // Create new user
        const [result] = await connection.execute(
          `INSERT INTO users (telegram_id, username, first_name, last_name, phone_number, avatar_url) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            ctx.from.id,
            ctx.from.username || null,
            ctx.from.first_name,
            ctx.from.last_name || null,
            phoneNumber,
            avatarUrl
          ]
        );
        userId = result.insertId;
        user = {
          id: userId,
          telegram_id: ctx.from.id,
          username: ctx.from.username,
          first_name: ctx.from.first_name,
          last_name: ctx.from.last_name,
          phone_number: phoneNumber,
          reputation: 0
        };
      } else {
        user = existing[0];
        userId = user.id;
        
        // Update phone number if needed
        if (!user.phone_number) {
          await connection.execute(
            'UPDATE users SET phone_number = ? WHERE id = ?',
            [phoneNumber, userId]
          );
        }
      }
      
      // Create auth token
      const authToken = crypto.randomBytes(32).toString('hex');
      
      // Store auth token in database
      await connection.execute(
        'INSERT INTO auth_tokens (user_id, token, session_id, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
        [userId, authToken, sessionId]
      );
      
      // Send success message
      await ctx.reply(
        '✅ Отлично! Вы успешно авторизованы!\n\n' +
        '🌐 Вернитесь на сайт и нажмите кнопку "Продолжить"\n\n' +
        '⏰ У вас есть 5 минут чтобы завершить авторизацию на сайте',
        Markup.inlineKeyboard([
          [Markup.button.url('🌐 Перейти на сайт', process.env.SITE_URL)]
        ])
      );
      
      // Clean up session
      authSessions.delete(ctx.from.id);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create auth token error:', error);
    throw error;
  }
}

async function checkChatMember(ctx, chatId, userId) {
  try {
    const member = await ctx.telegram.getChatMember(chatId, userId);
    return ['creator', 'administrator', 'member'].includes(member.status);
  } catch (error) {
    console.log(`User ${userId} is not in chat ${chatId}`);
    return false;
  }
}

// Clean up old sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, session] of authSessions.entries()) {
    if (now - session.timestamp > 5 * 60 * 1000) { // 5 minutes
      authSessions.delete(userId);
    }
  }
}, 60000); // Check every minute