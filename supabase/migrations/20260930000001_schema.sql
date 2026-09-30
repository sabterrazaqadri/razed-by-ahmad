-- Razed by Ahmad — core schema + row level security

-- ── helpers ──────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Admins are listed explicitly. Being "authenticated" is not enough:
-- if public sign-ups are ever switched on, a stranger must not get write access.
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create policy "admins read admin list" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- ── products ─────────────────────────────────────────────
create table public.products (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name            text not null,
  tagline         text,
  description     text,
  notes_top       text[] not null default '{}',
  notes_heart     text[] not null default '{}',
  notes_base      text[] not null default '{}',
  family          text check (family in ('oud','amber','floral','musk','smoke')),
  badge           text,
  bottle_variant  text not null default 'a' check (bottle_variant in ('a','b','c')),
  images          text[] not null default '{}',
  is_active       boolean not null default true,
  is_featured     boolean not null default false,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index products_active_sort_idx on public.products (is_active, sort_order);
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ── variants ─────────────────────────────────────────────
create table public.product_variants (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products (id) on delete cascade,
  size_ml           int not null check (size_ml > 0),
  price             numeric(10,2) not null check (price >= 0),
  compare_at_price  numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  stock             int not null default 0 check (stock >= 0),
  is_default        boolean not null default false
);
create index product_variants_product_idx on public.product_variants (product_id);

-- ── site settings (single row) ───────────────────────────
create table public.site_settings (
  id                 int primary key default 1 check (id = 1),
  whatsapp_number    text not null default '923000000000' check (whatsapp_number ~ '^[0-9]{8,15}$'),
  free_delivery_day  int not null default 1 check (free_delivery_day between 0 and 6),
  spinner_day        int not null default 6 check (spinner_day between 0 and 6),
  spinner_enabled    boolean not null default true,
  announcement_text  text,
  hero_headline      text,
  hero_sub           text,
  currency           text not null default 'PKR',
  about_text         text,
  updated_at         timestamptz not null default now()
);
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ── spin prizes ──────────────────────────────────────────
create table public.spin_prizes (
  id           uuid primary key default gen_random_uuid(),
  label        text not null,
  short_label  text not null,
  weight       int not null default 1 check (weight >= 0),
  is_active    boolean not null default true,
  sort_order   int not null default 0
);

-- ── order intents ────────────────────────────────────────
create table public.order_intents (
  id                     uuid primary key default gen_random_uuid(),
  code                   text not null unique,
  product_id             uuid references public.products (id) on delete set null,
  variant_id             uuid references public.product_variants (id) on delete set null,
  -- snapshot so the order log survives product edits / deletes
  product_name           text not null,
  size_ml                int not null,
  qty                    int not null default 1 check (qty between 1 and 20),
  unit_price             numeric(10,2) not null,
  spin_eligible          boolean not null default false,
  spin_prize_id          uuid references public.spin_prizes (id) on delete set null,
  spin_prize_label       text,
  spin_used              boolean not null default false,
  free_delivery_applied  boolean not null default false,
  created_at             timestamptz not null default now()
);
create index order_intents_created_idx on public.order_intents (created_at desc);

-- ── RLS ──────────────────────────────────────────────────
alter table public.products          enable row level security;
alter table public.product_variants  enable row level security;
alter table public.site_settings     enable row level security;
alter table public.spin_prizes       enable row level security;
alter table public.order_intents     enable row level security;

-- public read
create policy "public read products" on public.products
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "public read variants" on public.product_variants
  for select to anon, authenticated using (true);
create policy "public read settings" on public.site_settings
  for select to anon, authenticated using (true);
create policy "public read prizes" on public.spin_prizes
  for select to anon, authenticated using (true);

-- admin write
create policy "admin insert products" on public.products for insert to authenticated with check ((select public.is_admin()));
create policy "admin update products" on public.products for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin delete products" on public.products for delete to authenticated using ((select public.is_admin()));

create policy "admin insert variants" on public.product_variants for insert to authenticated with check ((select public.is_admin()));
create policy "admin update variants" on public.product_variants for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin delete variants" on public.product_variants for delete to authenticated using ((select public.is_admin()));

create policy "admin update settings" on public.site_settings for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admin insert prizes" on public.spin_prizes for insert to authenticated with check ((select public.is_admin()));
create policy "admin update prizes" on public.spin_prizes for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin delete prizes" on public.spin_prizes for delete to authenticated using ((select public.is_admin()));

-- order intents: no public read, no direct writes. Writes go through the
-- security-definer functions in the next migration. Admin can read.
create policy "admin read order intents" on public.order_intents
  for select to authenticated using ((select public.is_admin()));
