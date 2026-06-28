create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount > 0),
  platform_fee integer not null default 0 check (platform_fee >= 0),
  total_amount integer not null check (total_amount > 0),
  currency text not null default 'IDR',
  status text not null default 'pending_payment' check (status in (
    'pending_payment',
    'paid_held',
    'in_progress',
    'completed',
    'release_requested',
    'released',
    'disputed',
    'cancelled',
    'refunded'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'midtrans',
  provider_reference text not null,
  checkout_url text,
  snap_token text,
  amount integer not null check (amount > 0),
  status text not null default 'pending' check (status in (
    'pending',
    'paid',
    'failed',
    'expired',
    'cancelled',
    'refunded'
  )),
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_reference)
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  provider text not null,
  event_type text not null,
  event_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.escrow_releases (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  admin_id uuid references public.profiles(id) on delete set null,
  amount integer not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'released', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  released_at timestamptz
);

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  opened_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  description text,
  status text not null default 'open' check (status in (
    'open',
    'reviewing',
    'resolved_release',
    'resolved_refund',
    'dismissed'
  )),
  admin_id uuid references public.profiles(id) on delete set null,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'rejected')),
  admin_id uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_buyer_id_idx on public.orders(buyer_id);
create index if not exists orders_seller_id_idx on public.orders(seller_id);
create index if not exists orders_post_id_idx on public.orders(post_id);
create index if not exists payments_order_id_idx on public.payments(order_id);
create index if not exists payment_events_payment_id_idx on public.payment_events(payment_id);
create index if not exists disputes_order_id_idx on public.disputes(order_id);

alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.escrow_releases enable row level security;
alter table public.disputes enable row level security;
alter table public.payout_requests enable row level security;

drop policy if exists "Order participants read orders" on public.orders;
create policy "Order participants read orders"
on public.orders for select
using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

drop policy if exists "Order participants read payments" on public.payments;
create policy "Order participants read payments"
on public.payments for select
using (
  exists (
    select 1
    from public.orders
    where orders.id = payments.order_id
      and (orders.buyer_id = auth.uid() or orders.seller_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "Admins read payment events" on public.payment_events;
create policy "Admins read payment events"
on public.payment_events for select
using (public.is_admin());

drop policy if exists "Order participants read disputes" on public.disputes;
create policy "Order participants read disputes"
on public.disputes for select
using (
  exists (
    select 1
    from public.orders
    where orders.id = disputes.order_id
      and (orders.buyer_id = auth.uid() or orders.seller_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "Order participants open disputes" on public.disputes;
create policy "Order participants open disputes"
on public.disputes for insert
with check (
  opened_by = auth.uid()
  and exists (
    select 1
    from public.orders
    where orders.id = disputes.order_id
      and (orders.buyer_id = auth.uid() or orders.seller_id = auth.uid())
  )
);

drop policy if exists "Admins read escrow releases" on public.escrow_releases;
create policy "Admins read escrow releases"
on public.escrow_releases for select
using (public.is_admin());

drop policy if exists "Sellers read own payout requests" on public.payout_requests;
create policy "Sellers read own payout requests"
on public.payout_requests for select
using (seller_id = auth.uid() or public.is_admin());

notify pgrst, 'reload schema';
