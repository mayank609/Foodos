-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Platforms (Swiggy, Zomato, etc.)
create table platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  base_url text not null,
  deep_link_template text,
  created_at timestamptz default now()
);

insert into platforms (name, slug, base_url, deep_link_template) values
  ('Swiggy', 'swiggy', 'https://www.swiggy.com', 'https://www.swiggy.com/restaurants/{restaurant_slug}'),
  ('Zomato', 'zomato', 'https://www.zomato.com', 'https://www.zomato.com/{city}/{restaurant_slug}');

-- Restaurants
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  locality text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  cuisine_types text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Restaurant presence on each platform
create table restaurant_platforms (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  platform_id uuid references platforms(id) on delete cascade,
  platform_restaurant_id text not null,
  platform_restaurant_slug text,
  rating numeric(3,2),
  total_ratings integer,
  is_open boolean default true,
  deep_link text,
  last_scraped_at timestamptz,
  unique(platform_id, platform_restaurant_id)
);

-- Menu items (platform-independent)
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  category text,
  description text,
  is_veg boolean,
  image_url text,
  created_at timestamptz default now()
);

-- Prices per platform per item
create table prices (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid references menu_items(id) on delete cascade,
  restaurant_platform_id uuid references restaurant_platforms(id) on delete cascade,
  price_paise integer not null,
  delivery_fee_paise integer default 0,
  platform_fee_paise integer default 0,
  eta_minutes integer,
  is_available boolean default true,
  scraped_at timestamptz default now()
);

-- Active offers / coupons
create table offers (
  id uuid primary key default gen_random_uuid(),
  restaurant_platform_id uuid references restaurant_platforms(id) on delete cascade,
  title text not null,
  description text,
  discount_type text check (discount_type in ('percentage', 'flat', 'free_delivery', 'cashback')),
  discount_value integer,
  min_order_paise integer,
  valid_until timestamptz,
  raw_text text,
  scraped_at timestamptz default now()
);

-- User favourites
create table favourites (
  id uuid primary key default gen_random_uuid(),
  user_firebase_uid text not null,
  restaurant_id uuid references restaurants(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  created_at timestamptz default now(),
  unique(user_firebase_uid, restaurant_id, menu_item_id)
);

-- Search history
create table search_history (
  id uuid primary key default gen_random_uuid(),
  user_firebase_uid text,
  query text not null,
  city text,
  result_count integer,
  searched_at timestamptz default now()
);
