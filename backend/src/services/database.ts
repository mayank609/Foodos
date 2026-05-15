import { createClient } from '@supabase/supabase-js';
import type { GroupedResult, PlatformResult, OfferSummary, Recommendation } from '../types/index.js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface RawPriceRow {
  price_paise: number;
  delivery_fee_paise: number;
  platform_fee_paise: number;
  eta_minutes: number | null;
  scraped_at: string;
  menu_items: {
    id: string;
    name: string;
    normalized_name: string;
    category: string | null;
    is_veg: boolean | null;
    image_url: string | null;
    restaurant_id: string;
    restaurants: { id: string; name: string };
  };
  restaurant_platforms: {
    id: string;
    rating: number | null;
    total_ratings: number | null;
    deep_link: string | null;
    platform_restaurant_id: string;
    platforms: { name: string; slug: string };
    offers: {
      title: string;
      description: string | null;
      discount_type: string | null;
      discount_value: number | null;
    }[];
  };
}

async function findItemIds(term: string, city: string | null): Promise<string[]> {
  // Full-text search
  const { data: ftData } = await supabase
    .from('menu_items')
    .select('id, restaurant_id')
    .textSearch('normalized_name', term, { type: 'websearch' })
    .limit(100);

  let candidates = ftData ?? [];

  // Fallback to ilike when full-text returns nothing
  if (!candidates.length) {
    const { data: likeData } = await supabase
      .from('menu_items')
      .select('id, restaurant_id')
      .ilike('normalized_name', `%${term}%`)
      .limit(50);
    candidates = likeData ?? [];
  }

  if (!candidates.length) return [];

  // Apply city filter in-memory to avoid join type complexity
  if (city) {
    const { data: cityRestaurants } = await supabase
      .from('restaurants')
      .select('id')
      .eq('city', city.toLowerCase());

    const cityIds = new Set((cityRestaurants ?? []).map(r => r.id));
    candidates = candidates.filter(c => cityIds.has(c.restaurant_id));
  }

  return candidates.map(c => c.id);
}

export async function searchItems(
  query: string,
  city: string | null
): Promise<GroupedResult[]> {
  const ids = await findItemIds(query.trim(), city);
  if (!ids.length) return [];

  const { data: prices, error } = await supabase
    .from('prices')
    .select(`
      price_paise,
      delivery_fee_paise,
      platform_fee_paise,
      eta_minutes,
      scraped_at,
      menu_items (
        id, name, normalized_name, category, is_veg, image_url, restaurant_id,
        restaurants ( id, name )
      ),
      restaurant_platforms (
        id, rating, total_ratings, deep_link, platform_restaurant_id,
        platforms ( name, slug ),
        offers ( title, description, discount_type, discount_value )
      )
    `)
    .in('menu_item_id', ids)
    .eq('is_available', true)
    .order('scraped_at', { ascending: false })
    .limit(200);

  if (error || !prices) return [];

  return groupAndRankResults(prices as unknown as RawPriceRow[]);
}

function groupAndRankResults(rows: RawPriceRow[]): GroupedResult[] {
  // Keep only the most recent price row per (item, platform) pair
  const latestByItemPlatform = new Map<string, RawPriceRow>();
  for (const row of rows) {
    const key = `${row.menu_items.id}:${row.restaurant_platforms.platforms.slug}`;
    if (!latestByItemPlatform.has(key)) {
      latestByItemPlatform.set(key, row);
    }
  }

  const groups = new Map<string, PlatformResult[]>();
  const meta = new Map<string, {
    itemName: string; normalizedName: string;
    restaurantName: string; isVeg: boolean | null; imageUrl: string | null;
  }>();

  for (const row of latestByItemPlatform.values()) {
    const item = row.menu_items;
    const rp = row.restaurant_platforms;
    const key = item.id;

    if (!groups.has(key)) {
      groups.set(key, []);
      meta.set(key, {
        itemName: item.name,
        normalizedName: item.normalized_name,
        restaurantName: item.restaurants.name,
        isVeg: item.is_veg,
        imageUrl: item.image_url,
      });
    }

    const totalPricePaise =
      row.price_paise + row.delivery_fee_paise + row.platform_fee_paise;
    const freshness = Math.round(
      (Date.now() - new Date(row.scraped_at).getTime()) / 60000
    );

    const offers: OfferSummary[] = (rp.offers ?? []).map(o => ({
      title: o.title,
      description: o.description,
      discountType: o.discount_type,
      discountValue: o.discount_value,
    }));

    groups.get(key)!.push({
      platform: rp.platforms.name,
      platformSlug: rp.platforms.slug,
      restaurantName: item.restaurants.name,
      restaurantId: item.restaurants.id,
      restaurantPlatformId: rp.id,
      itemName: item.name,
      itemId: item.id,
      category: item.category,
      isVeg: item.is_veg,
      imageUrl: item.image_url,
      pricePaise: row.price_paise,
      deliveryFeePaise: row.delivery_fee_paise,
      platformFeePaise: row.platform_fee_paise,
      totalPricePaise,
      etaMinutes: row.eta_minutes,
      rating: rp.rating,
      totalRatings: rp.total_ratings,
      offers,
      deepLink: rp.deep_link,
      dataFreshnessMinutes: freshness,
    });
  }

  const results: GroupedResult[] = [];
  for (const [key, platforms] of groups) {
    const m = meta.get(key)!;
    results.push({ ...m, platforms, recommendation: computeRecommendation(platforms) });
  }
  return results;
}

function computeRecommendation(platforms: PlatformResult[]): Recommendation {
  if (!platforms.length) {
    return { cheapest: null, fastest: null, bestRated: null, bestValue: null };
  }

  const cheapest = platforms.reduce((a, b) =>
    a.totalPricePaise <= b.totalPricePaise ? a : b
  );

  const withEta = platforms.filter(p => p.etaMinutes != null);
  const fastest = withEta.length
    ? withEta.reduce((a, b) => (a.etaMinutes! <= b.etaMinutes! ? a : b))
    : null;

  const withRating = platforms.filter(p => p.rating != null);
  const bestRated = withRating.length
    ? withRating.reduce((a, b) => (a.rating! >= b.rating! ? a : b))
    : null;

  const maxPrice = Math.max(...platforms.map(p => p.totalPricePaise)) || 1;
  const maxEta = Math.max(...platforms.map(p => p.etaMinutes ?? 60)) || 1;
  const maxRating = Math.max(...platforms.map(p => p.rating ?? 0)) || 1;

  const scored = platforms.map(p => ({
    slug: p.platformSlug,
    score:
      (1 - p.totalPricePaise / maxPrice) * 0.5 +
      (1 - (p.etaMinutes ?? 60) / maxEta) * 0.3 +
      ((p.rating ?? 0) / maxRating) * 0.2,
  }));
  const bestValue = scored.reduce((a, b) => (a.score >= b.score ? a : b));

  return {
    cheapest: cheapest.platformSlug,
    fastest: fastest?.platformSlug ?? null,
    bestRated: bestRated?.platformSlug ?? null,
    bestValue: bestValue.slug,
  };
}

export async function saveSearchHistory(
  userId: string | null,
  query: string,
  city: string | null,
  resultCount: number
): Promise<void> {
  await supabase.from('search_history').insert({
    user_firebase_uid: userId,
    query,
    city,
    result_count: resultCount,
  });
}

export async function getSearchHistory(
  userId: string
): Promise<{ query: string; city: string | null; searched_at: string }[]> {
  const { data } = await supabase
    .from('search_history')
    .select('query, city, searched_at')
    .eq('user_firebase_uid', userId)
    .order('searched_at', { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function getFavourites(userId: string) {
  const { data } = await supabase
    .from('favourites')
    .select(`
      id, created_at,
      restaurants ( id, name, city, cuisine_types ),
      menu_items ( id, name, category )
    `)
    .eq('user_firebase_uid', userId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function addFavourite(
  userId: string,
  restaurantId: string,
  menuItemId: string | null
): Promise<void> {
  await supabase.from('favourites').upsert({
    user_firebase_uid: userId,
    restaurant_id: restaurantId,
    menu_item_id: menuItemId,
  });
}

export async function removeFavourite(
  userId: string,
  favouriteId: string
): Promise<void> {
  await supabase
    .from('favourites')
    .delete()
    .eq('id', favouriteId)
    .eq('user_firebase_uid', userId);
}
