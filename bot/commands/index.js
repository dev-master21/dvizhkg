import { topCommand } from './top.js';
import { helpCommand } from './help.js';
import { statsCommand } from './stats.js';
import { eventCommand } from './event.js';

export const setupCommands = (bot) => {
  // Register commands
  bot.command('top', topCommand);
  bot.command('help', helpCommand);
  bot.command('stats', statsCommand);
  bot.command('event', eventCommand);
  
  // Set command list in Telegram
  bot.telegram.setMyCommands([
    { command: 'top', description: '🏆 Топ-20 движняков' },
    { command: 'stats', description: '📊 Твоя статистика' },
    { command: 'event', description: '📅 Ближайшие события' },
    { command: 'help', description: '❓ Помощь' }
  ]);
  
  console.log('✅ Bot commands registered');
};