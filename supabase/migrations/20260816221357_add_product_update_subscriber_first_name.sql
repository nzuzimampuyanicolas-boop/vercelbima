alter table public.bima_product_update_subscribers
  add column if not exists first_name text;

alter table public.bima_product_update_subscribers
  add constraint bima_product_update_subscribers_first_name_length
  check (first_name is null or length(first_name) between 1 and 80);

comment on column public.bima_product_update_subscribers.first_name is
  'Prénom fourni avec le consentement aux mises à jour produit, utilisé pour personnaliser les messages.';
