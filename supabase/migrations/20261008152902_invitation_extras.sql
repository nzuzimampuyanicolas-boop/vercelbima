-- Additive migration. Preview reviewed; production approved and applied 2026-10-10.
alter table public.bima_events add column if not exists ticket_url text;
alter table public.bima_events add column if not exists show_available_names boolean not null default false;
notify pgrst, 'reload schema';
