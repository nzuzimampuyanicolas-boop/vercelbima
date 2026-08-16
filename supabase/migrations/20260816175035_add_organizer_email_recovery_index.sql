create index if not exists idx_bima_events_organizer_email
  on public.bima_events (organizer_email)
  where organizer_email is not null;

comment on column public.bima_events.organizer_email is
  'Organizer email used for management-link delivery and recovery, and occasional manual product feedback only.';
