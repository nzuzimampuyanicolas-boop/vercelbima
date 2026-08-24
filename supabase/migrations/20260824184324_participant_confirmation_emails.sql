alter table public.bima_participants
  add column if not exists email text,
  add column if not exists confirmation_email_requested_at timestamptz,
  add column if not exists confirmation_email_claimed_at timestamptz,
  add column if not exists confirmation_email_sent_at timestamptz,
  add column if not exists confirmation_email_attempt_count integer not null default 0;

alter table public.bima_participants
  drop constraint if exists bima_participants_email_format_check,
  add constraint bima_participants_email_format_check
    check (
      email is null
      or (
        email = lower(email)
        and char_length(email) between 3 and 254
        and email like '%_@_%._%'
      )
    ),
  drop constraint if exists bima_participants_confirmation_email_attempt_count_check,
  add constraint bima_participants_confirmation_email_attempt_count_check
    check (confirmation_email_attempt_count >= 0);

comment on column public.bima_participants.email is
  'Adresse facultative fournie après le vote, uniquement pour recevoir la confirmation de cette sortie ou de ce séjour.';
comment on column public.bima_participants.confirmation_email_requested_at is
  'Date du consentement fonctionnel explicite à recevoir la confirmation de cet événement.';
comment on column public.bima_participants.confirmation_email_claimed_at is
  'Verrou temporaire utilisé par le traitement serveur afin d’éviter les envois en double.';
comment on column public.bima_participants.confirmation_email_sent_at is
  'Date d’envoi réussi de la confirmation finale.';

revoke select (email, confirmation_email_requested_at, confirmation_email_claimed_at, confirmation_email_sent_at, confirmation_email_attempt_count)
  on public.bima_participants from anon, authenticated;
