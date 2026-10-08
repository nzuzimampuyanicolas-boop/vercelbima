-- Additive migration. Applied only to Preview BIMA for review.
alter table public.bima_events add column if not exists ticket_url text;
alter table public.bima_events add column if not exists show_available_names boolean not null default false;
notify pgrst, 'reload schema';
