import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { pool } from './services/database.js';
import { handleReputation } from './handlers/reputation.js';
import { handleMessages } from './handlers/messages.js';
import { handleStart, handleContact, handleCheckSubscription } from './handlers/auth.js';
import { setupCommands } from './commands/index.js';
import { startScheduledTasks } from './services/scheduler.js';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Добавьте это для отладки
bot.use((ctx, next) => {
  console.log('Update received:', ctx.updateType);
  if (ctx.message) {
    console.log('Message text:', ctx.message.text);
  }
  return next();
});

// Setup commands
setupCommands(bot);

// Auth handlers - ВАЖНО: должны быть ДО других middleware
bot.start(handleStart);
bot.on('contact', handleContact);
bot.action('check_subscription', handleCheckSubscription);

// Message counter middleware - ПОСЛЕ обработчиков команд
bot.use(async (ctx, next) => {
  // Пропускаем команды
  if (ctx.message?.text?.startsWith('/')) {
    return next();
  }
  
  if (ctx.message && ctx.from && !ctx.from.is_bot) {
    await handleMessages.countMessage(ctx);
  }
  return next();
});

// Reputation handler - только для обычных сообщений
bot.on('message', async (ctx) => {
  // Пропускаем команды
  if (ctx.message?.text?.startsWith('/')) {
    return;
  }
  await handleReputation(ctx);
});

// Start scheduled tasks
startScheduledTasks();

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}`, err);
});

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('SIGINT received, stopping bot...');
  bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('SIGTERM received, stopping bot...');
  bot.stop('SIGTERM');
  process.exit(0);
});

// Launch bot
bot.launch()
  .then(() => {
    console.log('🤖 DVIZH BISHKEK Bot started successfully!');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🕐 Timezone: ${process.env.TIMEZONE}`);
    console.log(`🔑 Bot token configured: ${process.env.BOT_TOKEN ? 'Yes' : 'No'}`);
  })
  .catch(err => {
    console.error('Failed to start bot:', err);
    process.exit(1);
  });

export default bot;