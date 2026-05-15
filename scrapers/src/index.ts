import 'dotenv/config';
import { startScheduler } from './scheduler.js';
import { closeBrowser } from './utils/browser.js';

process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeBrowser();
  process.exit(0);
});

startScheduler();
