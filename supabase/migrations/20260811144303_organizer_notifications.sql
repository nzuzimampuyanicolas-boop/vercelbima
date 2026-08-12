alter table public.bima_events
  add column if not exists notify_new_responses boolean not null default true,
  add column if not exists notify_reminders boolean not null default true,
  add column if not exists notifications_started_at timestamptz;

comment on column public.bima_events.notifications_started_at is
  'Null for historical events until the organizer explicitly activates notifications.';

create table if not exists public.bima_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bima_events(id) on delete cascade,
  kind text not null check (kind in ('participant_joined', 'event_full', 'deadline_48h', 'deadline_reached')),
  dedupe_key text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (event_id, dedupe_key)
);

create index if not exists idx_bima_notification_deliveries_pending
  on public.bima_notification_deliveries (status, created_at)
  where status in ('pending', 'failed');

create index if not exists idx_bima_events_notification_deadline
  on public.bima_events (response_deadline)
  where confirmed_date_id is null and response_deadline is not null and notifications_started_at is not null;

alter table public.bima_notification_deliveries enable row level security;
revoke all on table public.bima_notification_deliveries from anon, authenticated;
