create table if not exists public.bima_product_update_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique
    check (length(email) between 3 and 254 and email = lower(email)),
  source text not null default 'landing-page'
    check (length(source) between 1 and 80),
  created_at timestamptz not null default now(),
  last_subscribed_at timestamptz not null default now()
);

comment on table public.bima_product_update_subscribers is
  'Adresses ayant explicitement demandé les mises à jour produit BIMA.';

alter table public.bima_product_update_subscribers enable row level security;

revoke all on table public.bima_product_update_subscribers
  from public, anon, authenticated;
grant select, insert, update on table public.bima_product_update_subscribers
  to service_role;

create index if not exists idx_bima_product_update_subscribers_last_subscribed
  on public.bima_product_update_subscribers (last_subscribed_at desc);
