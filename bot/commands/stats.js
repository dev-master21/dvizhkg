import { pool } from '../services/database.js';

export const statsCommand = async (ctx) => {
  try {
    const userId = ctx.from.id;
    
    // Get user stats
    const [users] = await pool.execute(
      `SELECT * FROM users WHERE telegram_id = ?`,
      [userId]
    );
    
    if (users.length === 0) {
      return ctx.reply(
        '❌ Ты еще не зарегистрирован!\n' +
        `Зайди на сайт: ${process.env.SITE_URL}`
      );
    }
    
    const user = users[0];
    
    // Get user rank
    const [rankResult] = await pool.execute(
      `SELECT COUNT(*) + 1 as rank 
       FROM users 
       WHERE reputation > ? AND is_blocked = FALSE`,
      [user.reputation]
    );
    
    // Get events count
    const [eventsResult] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM event_registrations er
       JOIN users u ON er.user_id = u.id
       WHERE u.telegram_id = ?`,
      [userId]
    );
    
    // Calculate days in dvizh
    const registrationDate = new Date(user.registration_date);
    const now = new Date();
    const daysInDvizh = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));
    
    let message = '📊 *ТВОЯ СТАТИСТИКА* 📊\n\n';
    message += `👤 *Имя:* ${user.first_name || user.username || 'Анонимный движняк'}\n`;
    message += `🏆 *Репутация:* ${user.reputation}\n`;
    message += `📍 *Место в топе:* #${rankResult[0].rank}\n`;
    message += `💬 *Сообщений:* ${user.message_count}\n`;
    message += `🎉 *События:* ${eventsResult[0].count}\n`;
    message += `📅 *В движе:* ${daysInDvizh} дней\n\n`;
    
    // Add achievements
    if (user.reputation >= 1000) {
      message += '🔥 *Достижение:* БОГ ДВИЖА\n';
    } else if (user.reputation >= 500) {
      message += '👑 *Достижение:* Легенда\n';
    } else if (user.reputation >= 250) {
      message += '🎯 *Достижение:* Мастер\n';
    } else if (user.reputation >= 100) {
      message += '💯 *Достижение:* Сотка\n';
    } else if (user.reputation >= 50) {
      message += '🏆 *Достижение:* Звезда\n';
    } else if (user.reputation >= 25) {
      message += '⭐ *Достижение:* Активист\n';
    } else if (user.reputation >= 10) {
      message += '🌟 *Достижение:* Новичок\n';
    }
    
    message += `\n🌐 Полный профиль: ${process.env.SITE_URL}/profile`;
    
    ctx.replyWithMarkdown(message);
  } catch (error) {
    console.error('Stats command error:', error);
    ctx.reply('❌ Произошла ошибка при получении статистики');
  }
};