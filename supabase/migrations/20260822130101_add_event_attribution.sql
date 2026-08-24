alter table public.bima_events
  add column if not exists attribution_source text,
  add column if not exists attribution_medium text,
  add column if not exists attribution_campaign text,
  add column if not exists attribution_content text,
  add column if not exists attribution_referrer_host text;

create index if not exists idx_bima_events_attribution_source
  on public.bima_events (attribution_source)
  where attribution_source is not null;

comment on column public.bima_events.attribution_source is
  'Source d’acquisition déclarée par les paramètres UTM lors de la création.';
