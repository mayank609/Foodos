export interface NormalizedMenuItem {
  name: string;
  category: string | null;
  isVeg: boolean | null;
  imageUrl: string | null;
  pricePaise: number;
  isAvailable: boolean;
}

export interface NormalizedOffer {
  title: string;
  description: string | null;
  discountType: string | null;
  discountValue: number | null;
  rawText: string | null;
}

export interface NormalizedItem {
  platformSlug: string;
  city: string;
  restaurantName: string;
  platformRestaurantId: string;
  platformRestaurantSlug: string | null;
  rating: number | null;
  totalRatings: number | null;
  deepLink: string | null;
  deliveryFeePaise: number;
  platformFeePaise: number;
  etaMinutes: number | null;
  offers: NormalizedOffer[];
  menuItems: NormalizedMenuItem[];
}

export interface ScrapeTarget {
  restaurantId: string;
  restaurantName: string;
  city: string;
}

export abstract class BaseAdapter {
  abstract readonly platformSlug: string;

  abstract scrape(target: ScrapeTarget): Promise<NormalizedItem | null>;

  protected rupeeToP(rupees: number): number {
    return Math.round(rupees * 100);
  }

  protected parsePrice(raw: string | number): number {
    if (typeof raw === 'number') return this.rupeeToP(raw);
    const cleaned = String(raw).replace(/[^0-9.]/g, '');
    return this.rupeeToP(parseFloat(cleaned) || 0);
  }
}
