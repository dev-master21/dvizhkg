import fetch from 'node-fetch';
import crypto from 'crypto';

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Verify Telegram auth data
export const verifyTelegramAuth = (authData) => {
  const checkString = Object.keys(authData)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${authData[key]}`)
    .join('\n');
  
  const secretKey = crypto.createHash('sha256')
    .update(BOT_TOKEN)
    .digest();
  
  const hash = crypto.createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');
  
  return hash === authData.hash;
};

// Check if user is member of group/chat
export const checkChatMember = async (chatId, userId) => {
  try {
    const response = await fetch(
      `${TELEGRAM_API_URL}/getChatMember?chat_id=${chatId}&user_id=${userId}`
    );
    
    const data = await response.json();
    
    if (data.ok) {
      const status = data.result.status;
      return ['creator', 'administrator', 'member'].includes(status);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking chat member:', error);
    return false;
  }
};

// Send message to chat
export const sendMessageToChat = async (chatId, message, options = {}) => {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        ...options
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

// Send photo to chat
export const sendPhotoToChat = async (chatId, photoUrl, caption, options = {}) => {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'Markdown',
        ...options
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending photo:', error);
    return null;
  }
};

// Kick chat member
export const kickChatMember = async (chatId, userId) => {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/banChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        user_id: userId
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error kicking member:', error);
    return null;
  }
};