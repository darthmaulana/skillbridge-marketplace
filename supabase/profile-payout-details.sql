alter table public.profiles add column if not exists payout_method text;
alter table public.profiles add column if not exists payout_provider text;
alter table public.profiles add column if not exists payout_account_name text;
alter table public.profiles add column if not exists payout_account_number text;
alter table public.profiles add column if not exists payout_notes text;

notify pgrst, 'reload schema';
