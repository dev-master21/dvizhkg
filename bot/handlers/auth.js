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
      
      // Check if session exists and is valid
      const [sessions] = await pool.execute(
        'SELECT * FROM auth_sessions WHERE session_id = ? AND expires_at > NOW()',
        [sessionId]
      );
      
      if (sessions.length === 0) {
        return ctx.reply(
          '❌ Ссылка для авторизации недействительна или истекла.\n\n' +
          '🔄 Вернитесь на сайт и начните авторизацию заново.'
        );
      }
      
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
      // User is subscribed, create auth tokens
      await createAuthTokens(ctx, phone_number, session.sessionId);
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
      await createAuthTokens(ctx, session.phoneNumber, session.sessionId);
    }
  } catch (error) {
    console.error('Check subscription error:', error);
    ctx.reply('❌ Произошла ошибка. Попробуйте снова.');
  }
};

async function createAuthTokens(ctx, phoneNumber, sessionId) {
  try {
    const connection = await pool.getConnection();
    
    try {
      // Check if user already has valid auth tokens for this session
      const [existingTokens] = await connection.execute(
        `SELECT * FROM auth_tokens 
         WHERE session_id = ? AND expires_at > NOW() AND used = FALSE`,
        [sessionId]
      );
      
      if (existingTokens.length > 0) {
        // Tokens already exist, just send the URL
        const urlToken = existingTokens.find(t => t.token_type === 'url');
        if (urlToken) {
          const authUrl = `${process.env.SITE_URL}/auth-callback?session=${sessionId}&token=${urlToken.token}`;
          
          await ctx.reply(
            '✅ Вы уже авторизованы!\n\n' +
            '🌐 Нажмите кнопку ниже чтобы войти на сайт:',
            Markup.inlineKeyboard([
              [Markup.button.url('🚀 Войти на сайт DVIZH', authUrl)]
            ])
          );
          
          authSessions.delete(ctx.from.id);
          return;
        }
      }
      
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
      } else {
        user = existing[0];
        userId = user.id;
        
        // Update phone number and user info if needed
        await connection.execute(
          `UPDATE users SET 
           phone_number = COALESCE(phone_number, ?),
           username = ?,
           first_name = ?,
           last_name = ?,
           last_active = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            phoneNumber,
            ctx.from.username || null,
            ctx.from.first_name,
            ctx.from.last_name || null,
            userId
          ]
        );
      }
      
      // Create TWO auth tokens - one for immediate auth, one for URL
      const immediateToken = crypto.randomBytes(32).toString('hex');
      const urlToken = crypto.randomBytes(32).toString('hex');
      
      // Store both tokens
      await connection.execute(
        `INSERT INTO auth_tokens (user_id, token, token_type, session_id, expires_at) 
         VALUES 
         (?, ?, 'immediate', ?, DATE_ADD(NOW(), INTERVAL 1 MINUTE)),
         (?, ?, 'url', ?, DATE_ADD(NOW(), INTERVAL 1 MINUTE))`,
        [userId, immediateToken, sessionId, userId, urlToken, sessionId]
      );
      
      // Build auth URL with token
      const authUrl = `${process.env.SITE_URL}/auth-callback?session=${sessionId}&token=${urlToken}`;
      
      // Send success message with URL containing token
      await ctx.reply(
        '✅ Отлично! Авторизация прошла успешно!\n\n' +
        '🌐 Вы можете:\n' +
        '1. Вернуться в браузер где начали авторизацию - она завершится автоматически\n' +
        '2. Или нажать кнопку ниже чтобы войти прямо отсюда\n\n' +
        '⏰ Ссылка действительна 1 минуту',
        Markup.inlineKeyboard([
          [Markup.button.url('🚀 Войти на сайт DVIZH', authUrl)]
        ])
      );
      
      // Clean up session
      authSessions.delete(ctx.from.id);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create auth tokens error:', error);
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