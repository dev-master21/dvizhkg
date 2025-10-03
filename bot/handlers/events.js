import { pool } from '../services/database.js';
import bot from '../index.js';
import { format } from 'date-fns';

export const checkUpcomingEvents = async () => {
  try {
    const connection = await pool.getConnection();
    
    try {
      // Find events starting in the next hour
      const [events] = await connection.execute(
        `SELECT e.*, COUNT(er.user_id) as participant_count
         FROM events e
         LEFT JOIN event_registrations er ON e.id = er.event_id
         WHERE e.status = 'upcoming' 
         AND e.event_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 HOUR)
         GROUP BY e.id`,
        []
      );
      
      for (const event of events) {
        await sendEventReminder(event);
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error checking upcoming events:', error);
  }
};

async function sendEventReminder(event) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const siteUrl = process.env.SITE_URL;
  
  const eventTime = format(new Date(event.event_date), 'HH:mm');
  
  let message = `⏰ *СКОРО НАЧНЕТСЯ!* ⏰\n\n`;
  message += `*${event.title}*\n`;
  message += `📅 Сегодня в ${eventTime}\n`;
  message += `👥 Зарегистрировано: ${event.participant_count} человек\n\n`;
  message += `Не опаздывай на движуху! 🔥`;
  
  const keyboard = {
    inline_keyboard: [[
      { text: '📍 Подробнее', url: `${siteUrl}/events/${event.id}` }
    ]]
  };
  
  await bot.telegram.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
}