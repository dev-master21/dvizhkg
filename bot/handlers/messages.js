import { pool } from '../services/database.js';

class MessageHandler {
  constructor() {
    this.messageBuffer = new Map();
    this.flushInterval = 5000; // Flush every 5 seconds
    this.startFlushing();
  }

  async countMessage(ctx) {
    try {
      const userId = ctx.from.id;
      const current = this.messageBuffer.get(userId) || 0;
      this.messageBuffer.set(userId, current + 1);
      
      // Also ensure user exists
      await this.ensureUser(userId, ctx.from);
    } catch (error) {
      console.error('Message count error:', error);
    }
  }

  async ensureUser(telegramId, userData) {
    try {
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE telegram_id = ?',
        [telegramId]
      );
      
      if (existing.length === 0) {
        await pool.execute(
          `INSERT INTO users (telegram_id, username, first_name, last_name) 
           VALUES (?, ?, ?, ?)`,
          [
            telegramId,
            userData.username || null,
            userData.first_name || null,
            userData.last_name || null
          ]
        );
      }
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') {
        console.error('Error ensuring user:', error);
      }
    }
  }

  startFlushing() {
    setInterval(async () => {
      await this.flushMessageCounts();
    }, this.flushInterval);
  }

  async flushMessageCounts() {
    if (this.messageBuffer.size === 0) return;
    
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      for (const [telegramId, count] of this.messageBuffer.entries()) {
        await connection.execute(
          `UPDATE users 
           SET message_count = message_count + ?, 
               last_active = CURRENT_TIMESTAMP 
           WHERE telegram_id = ?`,
          [count, telegramId]
        );
      }
      
      await connection.commit();
      this.messageBuffer.clear();
    } catch (error) {
      await connection.rollback();
      console.error('Error flushing message counts:', error);
    } finally {
      connection.release();
    }
  }
}

export const handleMessages = new MessageHandler();