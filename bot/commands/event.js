import { pool } from '../services/database.js';

export const eventCommand = async (ctx) => {
  try {
    // Get upcoming events
    const [events] = await pool.execute(
      `SELECT e.*, COUNT(er.user_id) as participant_count
       FROM events e
       LEFT JOIN event_registrations er ON e.id = er.event_id
       WHERE e.status = 'upcoming'
       GROUP BY e.id
       ORDER BY e.event_date ASC
       LIMIT 5`
    );
    
    if (events.length === 0) {
      return ctx.reply(
        '📅 Пока нет запланированных событий\n\n' +
        `🌐 Следи за обновлениями на сайте: ${process.env.SITE_URL}/events`
      );
    }
    
    let message = '📅 *БЛИЖАЙШИЕ СОБЫТИЯ* 📅\n\n';
    
    events.forEach((event, index) => {
      const eventDate = new Date(event.event_date);
      const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                     'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
      const day = eventDate.getDate();
      const month = months[eventDate.getMonth()];
      const hours = eventDate.getHours().toString().padStart(2, '0');
      const minutes = eventDate.getMinutes().toString().padStart(2, '0');
      
      const dateStr = `${day} ${month}, ${hours}:${minutes}`;
      
      message += `${index + 1}. *${event.title}*\n`;
      message += `📆 ${dateStr}\n`;
      message += `👥 Участников: ${event.participant_count}`;
      if (event.max_participants) {
        message += `/${event.max_participants}`;
      }
      message += '\n';
      message += `💰 ${event.price > 0 ? `${event.price} сом` : 'БЕСПЛАТНО'}\n`;
      message += `🔗 ${process.env.SITE_URL}/events/${event.id}\n\n`;
    });
    
    message += `🌐 Все события: ${process.env.SITE_URL}/events`;
    
    ctx.replyWithMarkdown(message);
  } catch (error) {
    console.error('Event command error:', error);
    ctx.reply('❌ Произошла ошибка при получении событий');
  }
};