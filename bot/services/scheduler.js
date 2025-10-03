import cron from 'node-cron';
import { resetDailyLimits } from '../handlers/reputation.js';
import { checkUpcomingEvents } from '../handlers/events.js';

export const startScheduledTasks = () => {
  // Reset reputation limits at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Resetting daily reputation limits...');
    await resetDailyLimits();
  }, {
    timezone: process.env.TIMEZONE
  });

  // Check for events starting in 1 hour (every 30 minutes)
  cron.schedule('*/30 * * * *', async () => {
    console.log('🔔 Checking upcoming events...');
    await checkUpcomingEvents();
  }, {
    timezone: process.env.TIMEZONE
  });

  console.log('⏰ Scheduled tasks started');
};