alter table public.bima_events
  add column if not exists organizer_email text;

comment on column public.bima_events.organizer_email is
  'Email used to deliver the private event management link.';
