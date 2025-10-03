import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { pool } from './services/database.js';
import { handleReputation } from './handlers/reputation.js';
import { handleMessages } from './handlers/messages.js';
import { setupCommands } from './commands/index.js';
import { startScheduledTasks } from './services/scheduler.js';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Setup commands
setupCommands(bot);

// Message counter middleware
bot.use(async (ctx, next) => {
  if (ctx.message && ctx.from && !ctx.from.is_bot) {
    await handleMessages.countMessage(ctx);
  }
  return next();
});

// Reputation handler
bot.on('message', async (ctx) => {
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
  })
  .catch(err => {
    console.error('Failed to start bot:', err);
    process.exit(1);
  });

export default bot;