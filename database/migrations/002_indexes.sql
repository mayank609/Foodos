-- Indexes for fast search
create index idx_menu_items_normalized_name on menu_items using gin(to_tsvector('english', normalized_name));
create index idx_menu_items_restaurant on menu_items(restaurant_id);
create index idx_restaurants_city on restaurants(city);
create index idx_restaurant_platforms_restaurant on restaurant_platforms(restaurant_id);
create index idx_restaurant_platforms_platform on restaurant_platforms(platform_id);
create index idx_prices_menu_item on prices(menu_item_id);
create index idx_prices_restaurant_platform on prices(restaurant_platform_id);
create index idx_prices_scraped_at on prices(scraped_at desc);
create index idx_offers_restaurant_platform on offers(restaurant_platform_id);
create index idx_search_history_user on search_history(user_firebase_uid);
create index idx_search_history_searched_at on search_history(searched_at desc);
create index idx_favourites_user on favourites(user_firebase_uid);

-- Partial index for available items only
create index idx_prices_available on prices(menu_item_id) where is_available = true;
