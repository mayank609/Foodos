import { SwiggyAdapter } from './adapters/swiggy.js';
import { ZomatoAdapter } from './adapters/zomato.js';
import { upsertScrapedData } from './utils/database.js';
import type { ScrapeTarget } from './adapters/base.js';

const INTERVAL_MS = parseInt(process.env.SCRAPE_INTERVAL_MINUTES ?? '15') * 60 * 1000;

const swiggy = new SwiggyAdapter();
const zomato = new ZomatoAdapter();

// Seed targets — in production, load these from the DB
const SEED_TARGETS: ScrapeTarget[] = [
  { restaurantId: 'bk-bangalore-mg-road', restaurantName: 'Burger King', city: 'bangalore' },
  { restaurantId: 'mc-bangalore-koramangala', restaurantName: "McDonald's", city: 'bangalore' },
  { restaurantId: 'dominos-bangalore-indiranagar', restaurantName: "Domino's Pizza", city: 'bangalore' },
  { restaurantId: 'pizza-hut-bangalore-hsr', restaurantName: 'Pizza Hut', city: 'bangalore' },
  { restaurantId: 'kfc-bangalore-whitefield', restaurantName: 'KFC', city: 'bangalore' },
];

export async function runScrapeRound(): Promise<void> {
  console.log(`[Scheduler] Starting scrape round at ${new Date().toISOString()}`);
  const cities = (process.env.SCRAPE_CITIES ?? 'bangalore').split(',').map(c => c.trim());

  const targets = SEED_TARGETS.filter(t => cities.includes(t.city));

  for (const target of targets) {
    try {
      console.log(`[Scheduler] Scraping ${target.restaurantName} (${target.city}) on Swiggy…`);
      const swiggyData = await swiggy.scrape(target);
      if (swiggyData) await upsertScrapedData([swiggyData]);

      // Stagger requests to avoid triggering rate limits
      await delay(2000);

      console.log(`[Scheduler] Scraping ${target.restaurantName} (${target.city}) on Zomato…`);
      const zomatoData = await zomato.scrape(target);
      if (zomatoData) await upsertScrapedData([zomatoData]);

      await delay(2000);
    } catch (err) {
      console.error(`[Scheduler] Failed for ${target.restaurantName}:`, err);
    }
  }

  console.log(`[Scheduler] Round complete at ${new Date().toISOString()}`);
}

export function startScheduler(): void {
  runScrapeRound();
  setInterval(runScrapeRound, INTERVAL_MS);
  console.log(`[Scheduler] Running every ${INTERVAL_MS / 60000} minutes`);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
