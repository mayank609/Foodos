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

export interface Recommendation {
  cheapest: string | null;
  fastest: string | null;
  bestRated: string | null;
  bestValue: string | null;
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

export interface SearchResponse {
  query: string;
  city: string | null;
  results: GroupedResult[];
  cachedAt: string | null;
  fromCache: boolean;
}

export interface FavouriteItem {
  id: string;
  created_at: string;
  restaurants: { id: string; name: string; city: string; cuisine_types: string[] | null };
  menu_items: { id: string; name: string; category: string | null } | null;
}

export interface HistoryItem {
  query: string;
  city: string | null;
  searched_at: string;
}
