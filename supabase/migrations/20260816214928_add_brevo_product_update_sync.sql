alter table public.bima_product_update_subscribers
  add column if not exists brevo_sync_attempted_at timestamptz,
  add column if not exists brevo_synced_at timestamptz,
  add column if not exists brevo_sync_error text;

comment on column public.bima_product_update_subscribers.brevo_sync_attempted_at is
  'Date de la dernière tentative de synchronisation vers Brevo.';
comment on column public.bima_product_update_subscribers.brevo_synced_at is
  'Date de la dernière synchronisation Brevo réussie.';
comment on column public.bima_product_update_subscribers.brevo_sync_error is
  'Dernière erreur de synchronisation Brevo, sans donnée secrète.';
