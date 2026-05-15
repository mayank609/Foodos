-- Unique constraints required by upsert operations in the scraper pipeline

-- restaurants: one row per (name, city) combination
alter table restaurants
  add constraint restaurants_name_city_unique unique (name, city);

-- menu_items: one row per item name within a restaurant
alter table menu_items
  add constraint menu_items_restaurant_name_unique unique (restaurant_id, name);

-- prices: remove stale rows older than 2 hours on each scrape cycle
-- (the scraper inserts fresh rows; this function is called by the scheduler)
create or replace function prune_old_prices() returns void language sql as $$
  delete from prices
  where scraped_at < now() - interval '2 hours'
    and id not in (
      select distinct on (menu_item_id, restaurant_platform_id) id
      from prices
      order by menu_item_id, restaurant_platform_id, scraped_at desc
    );
$$;
