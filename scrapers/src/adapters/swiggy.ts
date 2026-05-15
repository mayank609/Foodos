import { Page } from 'playwright';
import { BaseAdapter, NormalizedItem, ScrapeTarget } from './base.js';
import { createContext, newPage } from '../utils/browser.js';

interface SwiggyRestaurantResponse {
  data?: {
    cards?: Array<{
      groupedCard?: {
        cardGroupMap?: {
          REGULAR?: {
            cards?: Array<{
              card?: {
                card?: {
                  itemCards?: Array<{
                    card?: {
                      info?: {
                        name?: string;
                        category?: string;
                        isVeg?: number;
                        imageId?: string;
                        price?: number;
                        defaultPrice?: number;
                        inStock?: number;
                      };
                    };
                  }>;
                  title?: string;
                };
              };
            }>;
          };
        };
      };
      card?: {
        card?: {
          info?: {
            name?: string;
            avgRatingString?: string;
            totalRatingsString?: string;
            sla?: { deliveryTime?: number };
            feeDetails?: { totalFee?: number; icon?: string; message?: string };
            aggregatedDiscountInfoV3?: { header?: string; subHeader?: string };
            offers?: Array<{ info?: { header?: string; description?: string; type?: string; discountedPrice?: number; minAmount?: number } }>;
          };
        };
      };
    }>;
  };
}

export class SwiggyAdapter extends BaseAdapter {
  readonly platformSlug = 'swiggy';

  async scrape(target: ScrapeTarget): Promise<NormalizedItem | null> {
    const context = await createContext();
    const page = await newPage(context);
    let captured: SwiggyRestaurantResponse | null = null;

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('api/menu') || url.includes('dapi/menu')) {
        try {
          captured = await response.json() as SwiggyRestaurantResponse;
        } catch {
          // ignore parse errors
        }
      }
    });

    try {
      const searchUrl = `https://www.swiggy.com/search?query=${encodeURIComponent(target.restaurantName)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await this.clickFirstRestaurant(page);
      await page.waitForTimeout(3000);
    } catch {
      // Network or navigation error — return null
    } finally {
      await context.close();
    }

    if (!captured) return null;
    return this.normalize(captured, target);
  }

  private async clickFirstRestaurant(page: Page): Promise<void> {
    try {
      const firstResult = page.locator('[data-testid="restaurant-item"]').first();
      await firstResult.click({ timeout: 5000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch {
      // Selector may vary — handled gracefully
    }
  }

  private normalize(data: SwiggyRestaurantResponse, target: ScrapeTarget): NormalizedItem | null {
    const cards = data?.data?.cards ?? [];
    let restaurantInfo: SwiggyRestaurantResponse['data']['cards'][0]['card']['card']['info'] | null = null;
    const menuItems: NormalizedItem['menuItems'] = [];
    const offers: NormalizedItem['offers'] = [];

    for (const card of cards) {
      const info = card?.card?.card?.info;
      if (info?.name) restaurantInfo = info;

      const regular = card?.groupedCard?.cardGroupMap?.REGULAR?.cards ?? [];
      for (const c of regular) {
        const category = c?.card?.card?.title ?? null;
        const itemCards = c?.card?.card?.itemCards ?? [];
        for (const ic of itemCards) {
          const item = ic?.card?.info;
          if (!item?.name) continue;
          const pricePaise = item.price ?? item.defaultPrice ?? 0;
          menuItems.push({
            name: item.name,
            category,
            isVeg: item.isVeg != null ? item.isVeg === 1 : null,
            imageUrl: item.imageId ? `https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_208,h_208,c_fit/${item.imageId}` : null,
            pricePaise,
            isAvailable: item.inStock === 1,
          });
        }
      }
    }

    if (!restaurantInfo) return null;

    const rawOffers = restaurantInfo.offers ?? [];
    for (const o of rawOffers) {
      const info = o.info;
      if (!info?.header) continue;
      offers.push({
        title: info.header,
        description: info.description ?? null,
        discountType: info.type?.toLowerCase() ?? null,
        discountValue: info.discountedPrice ?? null,
        rawText: `${info.header} ${info.description ?? ''}`.trim(),
      });
    }

    const ratingNum = parseFloat(restaurantInfo.avgRatingString ?? '0') || null;
    const totalRatings = parseInt(restaurantInfo.totalRatingsString?.replace(/[^0-9]/g, '') ?? '0') || null;
    const eta = restaurantInfo.sla?.deliveryTime ?? null;
    const deliveryFee = restaurantInfo.feeDetails?.totalFee ?? 0;

    return {
      platformSlug: this.platformSlug,
      city: target.city,
      restaurantName: restaurantInfo.name ?? target.restaurantName,
      platformRestaurantId: target.restaurantId,
      platformRestaurantSlug: null,
      rating: ratingNum,
      totalRatings,
      deepLink: `https://www.swiggy.com/restaurants/${target.restaurantId}`,
      deliveryFeePaise: this.rupeeToP(deliveryFee),
      platformFeePaise: 0,
      etaMinutes: eta,
      offers,
      menuItems,
    };
  }
}
