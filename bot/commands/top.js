import { pool } from '../services/database.js';

export const topCommand = async (ctx) => {
  try {
    const [rows] = await pool.execute(
      `SELECT telegram_id, username, first_name, last_name, reputation
       FROM users 
       WHERE reputation > 0 AND is_blocked = FALSE
       ORDER BY reputation DESC 
       LIMIT 20`
    );
    
    if (rows.length === 0) {
      return ctx.reply('📊 Пока нет пользователей с репутацией!');
    }
    
    let message = '🏆 *ТОП-20 ДВИЖНЯКОВ* 🏆\n\n';
    
    rows.forEach((user, index) => {
      const medal = index === 0 ? '🥇' : 
                   index === 1 ? '🥈' : 
                   index === 2 ? '🥉' : 
                   `${index + 1}.`;
      
      const name = user.first_name || user.username || 'Анонимный движняк';
      message += `${medal} ${name} — *${user.reputation}* реп.\n`;
    });
    
    message += `\n💪 Продолжай в том же духе!\n`;
    message += `🌐 Весь рейтинг на сайте: ${process.env.SITE_URL}`;
    
    ctx.replyWithMarkdown(message);
  } catch (error) {
    console.error('Top command error:', error);
    ctx.reply('❌ Произошла ошибка при получении топа');
  }
};