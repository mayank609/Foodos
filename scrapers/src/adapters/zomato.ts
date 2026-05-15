import { BaseAdapter, NormalizedItem, ScrapeTarget } from './base.js';
import { createContext, newPage } from '../utils/browser.js';

interface ZomatoMenuResponse {
  sections?: {
    SECTION_BASIC_INFO?: {
      name?: string;
      rating?: { aggregate_rating?: string; rating_count?: string };
      order_food_url?: string;
    };
    SECTION_DELIVERY_TIME?: { delivery_time_minutes?: number };
    SECTION_OFFERS?: {
      available_offers?: Array<{
        header?: string;
        offerLogo?: string;
        discount_info?: {
          description?: string;
          type?: string;
          value?: number;
          minimum_order?: number;
        };
      }>;
    };
    SECTION_MENU?: {
      categories?: Array<{
        name?: string;
        items?: Array<{
          name?: string;
          price?: number;
          item_type?: number; // 1=veg, 2=non-veg
          thumb?: string;
          availability?: { is_in_stock?: boolean };
          item_id?: string;
        }>;
      }>;
    };
  };
  delivery_fee?: number;
  platform_fee?: number;
}

export class ZomatoAdapter extends BaseAdapter {
  readonly platformSlug = 'zomato';

  async scrape(target: ScrapeTarget): Promise<NormalizedItem | null> {
    const context = await createContext();
    const page = await newPage(context);
    let captured: ZomatoMenuResponse | null = null;

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('api/restaurant') || url.includes('webroutes/restaurant')) {
        try {
          captured = await response.json() as ZomatoMenuResponse;
        } catch {
          // ignore
        }
      }
    });

    try {
      const searchUrl = `https://www.zomato.com/${target.city}/order-food-online?query=${encodeURIComponent(target.restaurantName)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
    } catch {
      // ignore
    } finally {
      await context.close();
    }

    if (!captured) return null;
    return this.normalize(captured, target);
  }

  private normalize(data: ZomatoMenuResponse, target: ScrapeTarget): NormalizedItem | null {
    const basic = data.sections?.SECTION_BASIC_INFO;
    const menu = data.sections?.SECTION_MENU;
    if (!basic || !menu) return null;

    const menuItems: NormalizedItem['menuItems'] = [];
    const offers: NormalizedItem['offers'] = [];

    for (const category of menu.categories ?? []) {
      for (const item of category.items ?? []) {
        if (!item.name || !item.price) continue;
        menuItems.push({
          name: item.name,
          category: category.name ?? null,
          isVeg: item.item_type != null ? item.item_type === 1 : null,
          imageUrl: item.thumb ?? null,
          pricePaise: this.rupeeToP(item.price),
          isAvailable: item.availability?.is_in_stock ?? true,
        });
      }
    }

    for (const offer of data.sections?.SECTION_OFFERS?.available_offers ?? []) {
      if (!offer.header) continue;
      offers.push({
        title: offer.header,
        description: offer.discount_info?.description ?? null,
        discountType: offer.discount_info?.type?.toLowerCase() ?? null,
        discountValue: offer.discount_info?.value ?? null,
        rawText: offer.header,
      });
    }

    const rating = parseFloat(basic.rating?.aggregate_rating ?? '0') || null;
    const totalRatings = parseInt(basic.rating?.rating_count?.replace(/[^0-9]/g, '') ?? '0') || null;
    const eta = data.sections?.SECTION_DELIVERY_TIME?.delivery_time_minutes ?? null;

    return {
      platformSlug: this.platformSlug,
      city: target.city,
      restaurantName: basic.name ?? target.restaurantName,
      platformRestaurantId: target.restaurantId,
      platformRestaurantSlug: basic.order_food_url?.split('/').pop() ?? null,
      rating,
      totalRatings,
      deepLink: `https://www.zomato.com/${target.city}/${basic.order_food_url ?? target.restaurantId}`,
      deliveryFeePaise: this.rupeeToP(data.delivery_fee ?? 0),
      platformFeePaise: this.rupeeToP(data.platform_fee ?? 0),
      etaMinutes: eta,
      offers,
      menuItems,
    };
  }
}
