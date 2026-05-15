import { createClient } from '@supabase/supabase-js';
import type { NormalizedItem } from '../adapters/base.js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function upsertScrapedData(items: NormalizedItem[]): Promise<void> {
  for (const item of items) {
    // 1. Upsert restaurant
    const { data: restaurant } = await supabase
      .from('restaurants')
      .upsert({ name: item.restaurantName, city: item.city }, { onConflict: 'name,city' })
      .select('id')
      .single();

    if (!restaurant) continue;

    // 2. Get platform id
    const { data: platform } = await supabase
      .from('platforms')
      .select('id')
      .eq('slug', item.platformSlug)
      .single();

    if (!platform) continue;

    // 3. Upsert restaurant_platform
    const { data: rp } = await supabase
      .from('restaurant_platforms')
      .upsert(
        {
          restaurant_id: restaurant.id,
          platform_id: platform.id,
          platform_restaurant_id: item.platformRestaurantId,
          platform_restaurant_slug: item.platformRestaurantSlug,
          rating: item.rating,
          total_ratings: item.totalRatings,
          deep_link: item.deepLink,
          last_scraped_at: new Date().toISOString(),
        },
        { onConflict: 'platform_id,platform_restaurant_id' }
      )
      .select('id')
      .single();

    if (!rp) continue;

    // 4. Upsert offers
    if (item.offers.length) {
      await supabase
        .from('offers')
        .delete()
        .eq('restaurant_platform_id', rp.id);

      await supabase.from('offers').insert(
        item.offers.map(o => ({
          restaurant_platform_id: rp.id,
          title: o.title,
          description: o.description,
          discount_type: o.discountType,
          discount_value: o.discountValue,
          raw_text: o.rawText,
          scraped_at: new Date().toISOString(),
        }))
      );
    }

    // 5. Upsert menu items and prices
    for (const menuItem of item.menuItems) {
      const normalized = menuItem.name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();

      const { data: mi } = await supabase
        .from('menu_items')
        .upsert(
          {
            restaurant_id: restaurant.id,
            name: menuItem.name,
            normalized_name: normalized,
            category: menuItem.category,
            is_veg: menuItem.isVeg,
            image_url: menuItem.imageUrl,
          },
          { onConflict: 'restaurant_id,name' }
        )
        .select('id')
        .single();

      if (!mi) continue;

      await supabase.from('prices').insert({
        menu_item_id: mi.id,
        restaurant_platform_id: rp.id,
        price_paise: menuItem.pricePaise,
        delivery_fee_paise: item.deliveryFeePaise,
        platform_fee_paise: item.platformFeePaise,
        eta_minutes: item.etaMinutes,
        is_available: menuItem.isAvailable,
        scraped_at: new Date().toISOString(),
      });
    }
  }
}
