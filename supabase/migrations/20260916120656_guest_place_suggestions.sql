alter table public.bima_events
  add column if not exists allow_place_suggestions boolean not null default false,
  add column if not exists notify_place_suggestions boolean not null default true;

comment on column public.bima_events.allow_place_suggestions is
  'Organizer-controlled experiment flag. Guests can suggest one alternative per itinerary place only when enabled.';

comment on column public.bima_events.notify_place_suggestions is
  'Whether the organizer receives an email when a guest creates a new place suggestion.';

create table if not exists public.bima_place_suggestions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bima_events(id) on delete cascade,
  target_place_id uuid not null references public.bima_places(id) on delete cascade,
  participant_id uuid not null references public.bima_participants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  city text not null check (char_length(city) between 1 and 100),
  maps_url text,
  status text not null default 'pending' check (status in ('pending', 'selected', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, target_place_id, participant_id)
);

create index if not exists idx_bima_place_suggestions_event_status
  on public.bima_place_suggestions (event_id, status, created_at desc);

create index if not exists idx_bima_place_suggestions_participant
  on public.bima_place_suggestions (participant_id);

alter table public.bima_place_suggestions enable row level security;
revoke all on table public.bima_place_suggestions from anon, authenticated;

alter table public.bima_notification_deliveries
  drop constraint if exists bima_notification_deliveries_kind_check;

alter table public.bima_notification_deliveries
  add constraint bima_notification_deliveries_kind_check
  check (kind in (
    'participant_joined',
    'event_full',
    'deadline_48h',
    'deadline_reached',
    'place_suggestion_created'
  ));
