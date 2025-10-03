import express from 'express';
import { pool } from '../services/database.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { upload, optimizeImage } from '../middleware/upload.js';
import { sendPhotoToChat, sendMessageToChat } from '../services/telegram.js';

const router = express.Router();

// Get all events
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [events] = await pool.execute(
      `SELECT e.*, 
        COUNT(DISTINCT er.user_id) as participant_count,
        COUNT(DISTINCT m.id) as media_count,
        GROUP_CONCAT(DISTINCT CONCAT(ec.type, ':', ec.value) SEPARATOR ',') as contacts
       FROM events e
       LEFT JOIN event_registrations er ON e.id = er.event_id
       LEFT JOIN event_contacts ec ON e.id = ec.event_id
       LEFT JOIN media m ON e.id = m.event_id
       GROUP BY e.id
       ORDER BY 
         CASE e.status 
           WHEN 'upcoming' THEN 1
           WHEN 'completed' THEN 2
           WHEN 'cancelled' THEN 3
         END,
         e.event_date ASC`
    );
    
    // Parse contacts
    const formattedEvents = events.map(event => ({
      ...event,
      contacts: event.contacts ? event.contacts.split(',').map(c => {
        const [type, value] = c.split(':');
        return { type, value };
      }) : []
    }));
    
    res.json(formattedEvents);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single event
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [events] = await pool.execute(
      `SELECT e.*, 
        COUNT(DISTINCT er.user_id) as participant_count,
        GROUP_CONCAT(DISTINCT CONCAT(ec.type, ':', ec.value) SEPARATOR ',') as contacts
       FROM events e
       LEFT JOIN event_registrations er ON e.id = er.event_id
       LEFT JOIN event_contacts ec ON e.id = ec.event_id
       WHERE e.id = ?
       GROUP BY e.id`,
      [req.params.id]
    );
    
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const event = events[0];
    
    // Parse contacts
    event.contacts = event.contacts ? event.contacts.split(',').map(c => {
      const [type, value] = c.split(':');
      return { type, value };
    }) : [];
    
    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create event (admin only)
router.post('/', authMiddleware, adminMiddleware, upload.single('preview'), optimizeImage, async (req, res) => {
  try {
    const { 
      title, description, event_date, price, 
      conditions, location_url, max_participants, contacts 
    } = req.body;
    
    if (!title || !event_date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }
    
    let previewUrl = null;
    if (req.file) {
      previewUrl = `/uploads/events/optimized-${req.file.filename}`;
    }
    
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Create event
      const [result] = await connection.execute(
        `INSERT INTO events 
         (title, description, preview_image, event_date, price, conditions, location_url, max_participants, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title, 
          description || null, 
          previewUrl, 
          event_date, 
          price || 0, 
          conditions || null, 
          location_url || null, 
          max_participants || null, 
          req.user.id
        ]
      );
      
      const eventId = result.insertId;
      
      // Add contacts
      if (contacts) {
        const contactsArray = JSON.parse(contacts);
        for (const contact of contactsArray) {
          if (contact.type && contact.value) {
            await connection.execute(
              'INSERT INTO event_contacts (event_id, type, value) VALUES (?, ?, ?)',
              [eventId, contact.type, contact.value]
            );
          }
        }
      }
      
      await connection.commit();
      
      // Send notification to Telegram
      const chatId = process.env.TELEGRAM_CHAT_ID;
      const siteUrl = process.env.SITE_URL;
      
      let message = `🎉 *НОВОЕ СОБЫТИЕ* 🎉\n\n`;
      message += `*${title}*\n\n`;
      message += `📅 Дата: ${new Date(event_date).toLocaleString('ru-RU', { timeZone: 'Asia/Bishkek' })}\n`;
      
      if (description) {
        message += `📝 ${description.substring(0, 200)}${description.length > 200 ? '...' : ''}\n\n`;
      }
      
      if (conditions) {
        message += `✅ Условия: ${conditions}\n`;
      }
      
      message += `💰 Стоимость: ${price > 0 ? `${price} сом` : '*БЕСПЛАТНО*'}\n`;
      
      if (location_url) {
        message += `📍 [Локация](${location_url})\n`;
      }
      
      if (contacts) {
        const contactsArray = JSON.parse(contacts);
        if (contactsArray.length > 0) {
          message += `\n📞 Контакты:\n`;
          contactsArray.forEach(contact => {
            message += `${contact.type}: ${contact.value}\n`;
          });
        }
      }
      
      const eventUrl = `${siteUrl}/events/${eventId}`;
      
      if (previewUrl) {
        await sendPhotoToChat(
          chatId, 
          `${siteUrl}${previewUrl}`,
          message,
          {
            reply_markup: {
              inline_keyboard: [[
                { text: '🔥 Подробнее на сайте', url: eventUrl }
              ]]
            }
          }
        );
      } else {
        await sendMessageToChat(
          chatId,
          message,
          {
            reply_markup: {
              inline_keyboard: [[
                { text: '🔥 Подробнее на сайте', url: eventUrl }
              ]]
            }
          }
        );
      }
      
      res.json({ id: eventId, success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update event status (admin only)
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['upcoming', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    await pool.execute(
      'UPDATE events SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register for event
router.post('/:id/register', authMiddleware, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    // Check if event exists and is upcoming
    const [events] = await pool.execute(
      'SELECT * FROM events WHERE id = ? AND status = "upcoming"',
      [eventId]
    );
    
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found or not available' });
    }
    
    const event = events[0];
    
    // Check max participants
    if (event.max_participants) {
      const [count] = await pool.execute(
        'SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?',
        [eventId]
      );
      
      if (count[0].count >= event.max_participants) {
        return res.status(400).json({ error: 'Event is full' });
      }
    }
    
    // Register user
    await pool.execute(
      'INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)',
      [eventId, userId]
    );
    
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Already registered' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Manual registration (admin only)
router.post('/:id/register-manual', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const eventId = req.params.id;
    
    await pool.execute(
      'INSERT INTO event_registrations (event_id, user_id, registered_by) VALUES (?, ?, ?)',
      [eventId, userId, req.user.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'User already registered' });
    }
    console.error('Manual registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get event participants
router.get('/:id/participants', authMiddleware, async (req, res) => {
  try {
    const [participants] = await pool.execute(
      `SELECT u.id, u.telegram_id, u.username, u.first_name, u.last_name, u.avatar_url, u.reputation,
        er.registered_at, er.registered_by
       FROM event_registrations er
       JOIN users u ON er.user_id = u.id
       WHERE er.event_id = ?
       ORDER BY er.registered_at ASC`,
      [req.params.id]
    );
    
    res.json(participants);
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send event reminder (admin only)
router.post('/:id/remind', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Get event data
    const [events] = await pool.execute(
      `SELECT e.*, GROUP_CONCAT(DISTINCT CONCAT(ec.type, ':', ec.value) SEPARATOR ',') as contacts
       FROM events e
       LEFT JOIN event_contacts ec ON e.id = ec.event_id
       WHERE e.id = ? AND e.status = 'upcoming'
       GROUP BY e.id`,
      [eventId]
    );
    
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found or not upcoming' });
    }
    
    const event = events[0];
    
    // Parse contacts
    event.contacts = event.contacts ? event.contacts.split(',').map(c => {
      const [type, value] = c.split(':');
      return { type, value };
    }) : [];
    
    // Send reminder to Telegram
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const siteUrl = process.env.SITE_URL;
    
    let message = `⚡ *НАПОМИНАНИЕ О СОБЫТИИ* ⚡\n\n`;
    message += `*${event.title}*\n\n`;
    message += `📅 Дата: ${new Date(event.event_date).toLocaleString('ru-RU', { timeZone: 'Asia/Bishkek' })}\n`;
    
    if (event.description) {
      message += `📝 ${event.description.substring(0, 200)}${event.description.length > 200 ? '...' : ''}\n\n`;
    }
    
    if (event.conditions) {
      message += `✅ Условия: ${event.conditions}\n`;
    }
    
    message += `💰 Стоимость: ${event.price > 0 ? `${event.price} сом` : '*БЕСПЛАТНО*'}\n`;
    
    if (event.location_url) {
      message += `📍 [Локация](${event.location_url})\n`;
    }
    
    if (event.contacts.length > 0) {
      message += `\n📞 Контакты:\n`;
      event.contacts.forEach(contact => {
        message += `${contact.type}: ${contact.value}\n`;
      });
    }
    
    message += `\n🔥 *Не пропусти! Будет движуха!* 🔥`;
    
    const eventUrl = `${siteUrl}/events/${eventId}`;
    
    if (event.preview_image) {
      await sendPhotoToChat(
        chatId,
        `${siteUrl}${event.preview_image}`,
        message,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '🎉 Подробнее на сайте', url: eventUrl }
            ]]
          }
        }
      );
    } else {
      await sendMessageToChat(
        chatId,
        message,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '🎉 Подробнее на сайте', url: eventUrl }
            ]]
          }
        }
      );
    }
    
    res.json({ success: true, message: 'Reminder sent' });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;