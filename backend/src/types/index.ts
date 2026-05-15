export interface Platform {
  id: string;
  name: string;
  slug: string;
  base_url: string;
  deep_link_template: string | null;
}

export interface PlatformResult {
  platform: string;
  platformSlug: string;
  restaurantName: string;
  restaurantId: string;
  restaurantPlatformId: string;
  itemName: string;
  itemId: string;
  category: string | null;
  isVeg: boolean | null;
  imageUrl: string | null;
  pricePaise: number;
  deliveryFeePaise: number;
  platformFeePaise: number;
  totalPricePaise: number;
  etaMinutes: number | null;
  rating: number | null;
  totalRatings: number | null;
  offers: OfferSummary[];
  deepLink: string | null;
  dataFreshnessMinutes: number;
}

export interface OfferSummary {
  title: string;
  description: string | null;
  discountType: string | null;
  discountValue: number | null;
}

export interface SearchResult {
  query: string;
  city: string | null;
  results: GroupedResult[];
  cachedAt: string | null;
}

export interface GroupedResult {
  itemName: string;
  normalizedName: string;
  restaurantName: string;
  isVeg: boolean | null;
  imageUrl: string | null;
  platforms: PlatformResult[];
  recommendation: Recommendation;
}

export interface Recommendation {
  cheapest: string | null;
  fastest: string | null;
  bestRated: string | null;
  bestValue: string | null;
}
