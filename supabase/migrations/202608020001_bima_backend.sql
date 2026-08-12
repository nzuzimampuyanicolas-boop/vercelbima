create extension if not exists pgcrypto with schema extensions;

create table if not exists public.bima_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  manage_token_hash text not null unique,
  organizer_name text not null,
  title text not null,
  city text not null,
  max_places integer not null check (max_places between 2 and 200),
  budget_eur integer check (budget_eur is null or (budget_eur >= 10 and budget_eur % 10 = 0)),
  response_deadline date,
  confirmed_date_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bima_places (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bima_events(id) on delete cascade,
  position integer not null check (position >= 0),
  start_time text,
  maps_url text not null,
  name text not null,
  rating text,
  rating_label text,
  address text,
  category text,
  hours text,
  image text,
  unique (event_id, position)
);

create table if not exists public.bima_date_options (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bima_events(id) on delete cascade,
  position integer not null check (position >= 0),
  starts_at timestamptz not null,
  unique (event_id, position)
);

alter table public.bima_events
  add constraint bima_events_confirmed_date_id_fkey
  foreign key (confirmed_date_id)
  references public.bima_date_options(id)
  on delete set null;

create table if not exists public.bima_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bima_events(id) on delete cascade,
  token_hash text not null,
  name text not null,
  role text not null check (role in ('organizer', 'guest')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, token_hash)
);

create table if not exists public.bima_date_votes (
  participant_id uuid not null references public.bima_participants(id) on delete cascade,
  date_option_id uuid not null references public.bima_date_options(id) on delete cascade,
  available boolean not null,
  updated_at timestamptz not null default now(),
  primary key (participant_id, date_option_id)
);

create table if not exists public.bima_stage_votes (
  participant_id uuid not null references public.bima_participants(id) on delete cascade,
  place_id uuid not null references public.bima_places(id) on delete cascade,
  attending boolean not null,
  updated_at timestamptz not null default now(),
  primary key (participant_id, place_id)
);

create table if not exists public.bima_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.bima_config (key, value)
values ('admin_token_sha256', '669573c588ceb99020009b8628b913ca9f133834c5824daa2fc586e4ed21ac46')
on conflict (key) do update
set value = excluded.value,
    updated_at = now();

create index if not exists idx_bima_places_event_id
  on public.bima_places(event_id);
create index if not exists idx_bima_date_options_event_id
  on public.bima_date_options(event_id);
create index if not exists idx_bima_participants_event_id
  on public.bima_participants(event_id);
create index if not exists idx_bima_date_votes_date_option_id
  on public.bima_date_votes(date_option_id);
create index if not exists idx_bima_stage_votes_place_id
  on public.bima_stage_votes(place_id);

alter table public.bima_events enable row level security;
alter table public.bima_places enable row level security;
alter table public.bima_date_options enable row level security;
alter table public.bima_participants enable row level security;
alter table public.bima_date_votes enable row level security;
alter table public.bima_stage_votes enable row level security;
alter table public.bima_config enable row level security;

revoke all on table public.bima_events from anon, authenticated;
revoke all on table public.bima_places from anon, authenticated;
revoke all on table public.bima_date_options from anon, authenticated;
revoke all on table public.bima_participants from anon, authenticated;
revoke all on table public.bima_date_votes from anon, authenticated;
revoke all on table public.bima_stage_votes from anon, authenticated;
revoke all on table public.bima_config from anon, authenticated;
