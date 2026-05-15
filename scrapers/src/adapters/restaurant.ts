import { BaseAdapter, NormalizedItem, ScrapeTarget } from './base.js';
import { createContext, newPage } from '../utils/browser.js';

interface MenuApiResponse {
  items?: Array<{
    name?: string;
    price?: number;
    category?: string;
    isVeg?: boolean;
    image?: string;
    available?: boolean;
  }>;
}

/**
 * Generic adapter for restaurant websites that expose a JSON menu API.
 * Intercepts any response that looks like a menu listing.
 */
export class RestaurantAdapter extends BaseAdapter {
  readonly platformSlug = 'restaurant';

  async scrape(target: ScrapeTarget & { websiteUrl: string }): Promise<NormalizedItem | null> {
    const context = await createContext();
    const page = await newPage(context);
    let captured: MenuApiResponse | null = null;

    page.on('response', async response => {
      const url = response.url();
      const ct = response.headers()['content-type'] ?? '';
      if (!ct.includes('application/json')) return;
      if (url.includes('menu') || url.includes('catalog') || url.includes('item')) {
        try {
          const json = await response.json() as MenuApiResponse;
          if (Array.isArray(json.items) && json.items.length) {
            captured = json;
          }
        } catch {
          // ignore
        }
      }
    });

    try {
      await page.goto(target.websiteUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
    } catch {
      // ignore
    } finally {
      await context.close();
    }

    if (!captured) return null;
    return this.normalize(captured, target);
  }

  private normalize(data: MenuApiResponse, target: ScrapeTarget): NormalizedItem {
    const menuItems = (data.items ?? [])
      .filter(i => i.name && i.price)
      .map(i => ({
        name: i.name!,
        category: i.category ?? null,
        isVeg: i.isVeg ?? null,
        imageUrl: i.image ?? null,
        pricePaise: this.rupeeToP(i.price!),
        isAvailable: i.available ?? true,
      }));

    return {
      platformSlug: this.platformSlug,
      city: target.city,
      restaurantName: target.restaurantName,
      platformRestaurantId: target.restaurantId,
      platformRestaurantSlug: null,
      rating: null,
      totalRatings: null,
      deepLink: null,
      deliveryFeePaise: 0,
      platformFeePaise: 0,
      etaMinutes: null,
      offers: [],
      menuItems,
    };
  }
}
