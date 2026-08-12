create table if not exists public.bima_short_links (
  code_hash text primary key,
  kind text not null check (kind in ('manage', 'participant')),
  event_id uuid not null references public.bima_events(id) on delete cascade,
  participant_id uuid references public.bima_participants(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_bima_short_links_event_id
  on public.bima_short_links(event_id);
create index if not exists idx_bima_short_links_participant_id
  on public.bima_short_links(participant_id);

alter table public.bima_short_links enable row level security;
revoke all on table public.bima_short_links from anon, authenticated;
