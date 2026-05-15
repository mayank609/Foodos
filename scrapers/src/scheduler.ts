import { SwiggyAdapter } from './adapters/swiggy.js';
import { ZomatoAdapter } from './adapters/zomato.js';
import { upsertScrapedData, supabase } from './utils/database.js';
import type { ScrapeTarget } from './adapters/base.js';

const INTERVAL_MS = parseInt(process.env.SCRAPE_INTERVAL_MINUTES ?? '15') * 60 * 1000;

const swiggy = new SwiggyAdapter();
const zomato = new ZomatoAdapter();

// Seed data written to DB on first run when the restaurants table is empty
const SEED_TARGETS: ScrapeTarget[] = [
  { restaurantId: 'seed-burger-king-bangalore', restaurantName: 'Burger King', city: 'bangalore' },
  { restaurantId: 'seed-mcdonalds-bangalore', restaurantName: "McDonald's", city: 'bangalore' },
  { restaurantId: 'seed-dominos-bangalore', restaurantName: "Domino's Pizza", city: 'bangalore' },
  { restaurantId: 'seed-pizza-hut-bangalore', restaurantName: 'Pizza Hut', city: 'bangalore' },
  { restaurantId: 'seed-kfc-bangalore', restaurantName: 'KFC', city: 'bangalore' },
];

async function loadTargetsFromDB(cities: string[]): Promise<ScrapeTarget[]> {
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, city')
    .in('city', cities)
    .order('name')
    .limit(100);

  if (restaurants?.length) {
    return restaurants.map(r => ({
      restaurantId: r.id,
      restaurantName: r.name,
      city: r.city,
    }));
  }

  // No restaurants in DB yet — insert seeds so subsequent rounds pick them up
  console.log('[Scheduler] No restaurants in DB — seeding initial targets');
  for (const t of SEED_TARGETS) {
    await supabase
      .from('restaurants')
      .upsert({ name: t.restaurantName, city: t.city }, { onConflict: 'name,city' });
  }
  return SEED_TARGETS.filter(t => cities.includes(t.city));
}

export async function runScrapeRound(): Promise<void> {
  console.log(`[Scheduler] Starting scrape round at ${new Date().toISOString()}`);
  const cities = (process.env.SCRAPE_CITIES ?? 'bangalore').split(',').map(c => c.trim());

  const targets = await loadTargetsFromDB(cities);
  console.log(`[Scheduler] ${targets.length} targets across ${cities.join(', ')}`);

  for (const target of targets) {
    try {
      console.log(`  → Swiggy: ${target.restaurantName} (${target.city})`);
      const swiggyData = await swiggy.scrape(target);
      if (swiggyData) await upsertScrapedData([swiggyData]);

      await delay(2000);

      console.log(`  → Zomato: ${target.restaurantName} (${target.city})`);
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
  const handle = setInterval(runScrapeRound, INTERVAL_MS);
  console.log(`[Scheduler] Running every ${INTERVAL_MS / 60000} minutes`);

  process.on('SIGINT', () => { clearInterval(handle); });
  process.on('SIGTERM', () => { clearInterval(handle); });
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
