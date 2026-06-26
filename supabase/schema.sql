create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('user', 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.verification_status as enum ('unverified', 'pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.post_type as enum ('job', 'skill');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.work_type as enum ('online', 'offline');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  avatar_url text,
  bio text,
  skills text[] not null default '{}',
  portfolio_url text,
  location text,
  role public.user_role not null default 'user',
  is_banned boolean not null default false,
  ban_reason text,
  verification_status public.verification_status not null default 'unverified',
  offline_job_access boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_type public.post_type not null,
  title text not null,
  description text not null,
  category text not null,
  budget_or_price numeric(14, 2) not null check (budget_or_price >= 0),
  work_type public.work_type not null,
  location text,
  deadline date,
  required_skills text[] not null default '{}',
  portfolio_url text,
  image_url text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete set null,
  participant_one_id uuid not null references public.profiles(id) on delete cascade,
  participant_two_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (participant_one_id <> participant_two_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  legal_name text not null,
  nik_hash text,
  ktp_image_path text not null,
  selfie_image_path text not null,
  status public.verification_status not null default 'pending',
  rejection_reason text,
  reviewed_by_admin_id uuid references public.profiles(id),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  raw_files_delete_at timestamptz
);

create index if not exists verification_requests_user_submitted_idx
on public.verification_requests (user_id, submitted_at desc);

create unique index if not exists verification_requests_one_pending_per_user
on public.verification_requests (user_id)
where status = 'pending';

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  reason text not null,
  description text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_user_id),
  check (blocker_id <> blocked_user_id)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id),
  action text not null,
  target_user_id uuid references public.profiles(id),
  target_post_id uuid references public.posts(id) on delete set null,
  verification_request_id uuid references public.verification_requests(id),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_active_user(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_user_id and not is_banned
  );
$$;

create unique index if not exists chats_unique_post_participants
on public.chats (post_id, participant_one_id, participant_two_id)
where post_id is not null;

create or replace function public.can_message_chat(target_chat_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chats chat
    left join public.posts post on post.id = chat.post_id
    join public.profiles participant_one on participant_one.id = chat.participant_one_id
    join public.profiles participant_two on participant_two.id = chat.participant_two_id
    where chat.id = target_chat_id
      and target_user_id in (chat.participant_one_id, chat.participant_two_id)
      and not participant_one.is_banned
      and not participant_two.is_banned
      and not exists (
        select 1
        from public.blocked_users blocked
        where (blocked.blocker_id = chat.participant_one_id and blocked.blocked_user_id = chat.participant_two_id)
           or (blocked.blocker_id = chat.participant_two_id and blocked.blocked_user_id = chat.participant_one_id)
      )
      and (
        post.id is null
        or post.work_type = 'online'
        or (
          participant_one.verification_status = 'approved'
          and participant_one.offline_job_access
          and participant_two.verification_status = 'approved'
          and participant_two.offline_job_access
        )
      )
  );
$$;

create or replace function public.open_chat_for_post(target_post_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  post_owner_id uuid;
  target_work_type public.work_type;
  first_participant uuid;
  second_participant uuid;
  result_chat_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not public.is_active_user(current_user_id) then
    raise exception 'This account is restricted';
  end if;

  select user_id, work_type
  into post_owner_id, target_work_type
  from public.posts
  where id = target_post_id;

  if post_owner_id is null then
    raise exception 'Post not found';
  end if;
  if post_owner_id = current_user_id then
    raise exception 'You cannot start a chat with yourself';
  end if;
  if exists (
    select 1 from public.blocked_users
    where (blocker_id = current_user_id and blocked_user_id = post_owner_id)
       or (blocker_id = post_owner_id and blocked_user_id = current_user_id)
  ) then
    raise exception 'Chat is unavailable because one account has blocked the other';
  end if;
  if target_work_type = 'offline' and not exists (
    select 1
    from public.profiles viewer
    join public.profiles owner on owner.id = post_owner_id
    where viewer.id = current_user_id
      and viewer.verification_status = 'approved'
      and viewer.offline_job_access
      and owner.verification_status = 'approved'
      and owner.offline_job_access
  ) then
    raise exception 'Both users must be verified for offline chat';
  end if;

  select id
  into result_chat_id
  from public.chats
  where post_id = target_post_id
    and current_user_id in (participant_one_id, participant_two_id)
    and post_owner_id in (participant_one_id, participant_two_id)
  limit 1;

  if result_chat_id is not null then
    return result_chat_id;
  end if;

  if current_user_id::text < post_owner_id::text then
    first_participant := current_user_id;
    second_participant := post_owner_id;
  else
    first_participant := post_owner_id;
    second_participant := current_user_id;
  end if;

  insert into public.chats (post_id, participant_one_id, participant_two_id)
  values (target_post_id, first_participant, second_participant)
  on conflict (post_id, participant_one_id, participant_two_id)
  where post_id is not null
  do update set post_id = excluded.post_id
  returning id into result_chat_id;

  return result_chat_id;
end;
$$;

revoke all on function public.can_message_chat(uuid, uuid) from public;
grant execute on function public.can_message_chat(uuid, uuid) to authenticated;
revoke all on function public.open_chat_for_post(uuid) from public;
grant execute on function public.open_chat_for_post(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.verification_requests enable row level security;
alter table public.reports enable row level security;
alter table public.blocked_users enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "Users read their profile" on public.profiles;
create policy "Users read their profile"
on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "Users update their profile" on public.profiles;
create policy "Users update their profile"
on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles"
on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.protect_sensitive_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() = 1 and not public.is_admin() and (
    new.email is distinct from old.email
    or new.role is distinct from old.role
    or new.is_banned is distinct from old.is_banned
    or new.ban_reason is distinct from old.ban_reason
    or new.verification_status is distinct from old.verification_status
    or new.offline_job_access is distinct from old.offline_job_access
  ) then
    raise exception 'Sensitive profile fields cannot be changed by users';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_sensitive_profile_fields on public.profiles;
create trigger protect_sensitive_profile_fields
  before update on public.profiles
  for each row execute procedure public.protect_sensitive_profile_fields();

create or replace function public.mark_verification_pending()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set verification_status = 'pending', offline_job_access = false
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists mark_verification_pending on public.verification_requests;
create trigger mark_verification_pending
  after insert on public.verification_requests
  for each row execute procedure public.mark_verification_pending();

create or replace function public.review_verification_request(
  target_request_id uuid,
  review_action text,
  review_reason text default null
)
returns public.verification_status
language plpgsql
security definer
set search_path = public
as $$
declare
  request_user_id uuid;
  current_status public.verification_status;
  next_status public.verification_status;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select user_id, status
  into request_user_id, current_status
  from public.verification_requests
  where id = target_request_id
  for update;

  if request_user_id is null then
    raise exception 'Verification request not found';
  end if;
  if current_status <> 'pending' then
    raise exception 'Only pending verification requests can be reviewed';
  end if;

  if review_action = 'approve' then
    next_status := 'approved';
    update public.verification_requests
    set status = next_status,
        rejection_reason = null,
        reviewed_by_admin_id = auth.uid(),
        reviewed_at = now(),
        raw_files_delete_at = now() + interval '30 days'
    where id = target_request_id;
    update public.profiles
    set verification_status = next_status,
        offline_job_access = true
    where id = request_user_id;
  elsif review_action in ('reject', 'resubmit') then
    if nullif(trim(review_reason), '') is null then
      raise exception 'A reason is required';
    end if;
    next_status := 'rejected';
    update public.verification_requests
    set status = next_status,
        rejection_reason = trim(review_reason),
        reviewed_by_admin_id = auth.uid(),
        reviewed_at = now(),
        raw_files_delete_at = now() + interval '30 days'
    where id = target_request_id;
    update public.profiles
    set verification_status = next_status,
        offline_job_access = false
    where id = request_user_id;
  elsif review_action = 'ban' then
    if nullif(trim(review_reason), '') is null then
      raise exception 'A ban reason is required';
    end if;
    next_status := 'rejected';
    update public.verification_requests
    set status = next_status,
        rejection_reason = trim(review_reason),
        reviewed_by_admin_id = auth.uid(),
        reviewed_at = now(),
        raw_files_delete_at = now() + interval '30 days'
    where id = target_request_id;
    update public.profiles
    set verification_status = next_status,
        offline_job_access = false,
        is_banned = true,
        ban_reason = trim(review_reason)
    where id = request_user_id;
  else
    raise exception 'Unsupported review action';
  end if;

  insert into public.admin_audit_logs (
    admin_id,
    action,
    target_user_id,
    verification_request_id
  ) values (
    auth.uid(),
    'verification_' || review_action,
    request_user_id,
    target_request_id
  );

  return next_status;
end;
$$;

revoke all on function public.review_verification_request(uuid, text, text) from public;
grant execute on function public.review_verification_request(uuid, text, text) to authenticated;

create or replace function public.admin_set_user_ban(
  target_user_id uuid,
  should_ban boolean,
  reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'You cannot restrict your own admin account';
  end if;
  if should_ban and nullif(trim(reason), '') is null then
    raise exception 'A restriction reason is required';
  end if;

  update public.profiles
  set is_banned = should_ban,
      ban_reason = case when should_ban then trim(reason) else null end,
      offline_job_access = case when should_ban then false else offline_job_access end
  where id = target_user_id;

  if not found then
    raise exception 'User not found';
  end if;

  insert into public.admin_audit_logs (admin_id, action, target_user_id)
  values (auth.uid(), case when should_ban then 'user_banned' else 'user_unbanned' end, target_user_id);
  return true;
end;
$$;

create or replace function public.admin_remove_post(target_post_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select user_id into owner_id from public.posts where id = target_post_id;
  if owner_id is null then
    raise exception 'Post not found';
  end if;

  insert into public.admin_audit_logs (admin_id, action, target_user_id, target_post_id)
  values (auth.uid(), 'post_removed', owner_id, target_post_id);
  delete from public.posts where id = target_post_id;
  return true;
end;
$$;

create or replace function public.admin_set_post_featured(
  target_post_id uuid,
  should_feature boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  update public.posts
  set is_featured = should_feature,
      updated_at = now()
  where id = target_post_id;

  if not found then
    raise exception 'Post not found';
  end if;

  insert into public.admin_audit_logs (admin_id, action, target_post_id)
  values (auth.uid(), case when should_feature then 'post_featured' else 'post_unfeatured' end, target_post_id);

  return true;
end;
$$;

create or replace function public.admin_review_report(
  target_report_id uuid,
  next_status public.report_status
)
returns public.report_status
language plpgsql
security definer
set search_path = public
as $$
declare
  report_user_id uuid;
  report_post_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  update public.reports
  set status = next_status
  where id = target_report_id
  returning reported_user_id, post_id into report_user_id, report_post_id;

  if not found then
    raise exception 'Report not found';
  end if;

  insert into public.admin_audit_logs (admin_id, action, target_user_id, target_post_id)
  values (auth.uid(), 'report_' || next_status::text, report_user_id, report_post_id);
  return next_status;
end;
$$;

revoke all on function public.admin_set_user_ban(uuid, boolean, text) from public;
grant execute on function public.admin_set_user_ban(uuid, boolean, text) to authenticated;
revoke all on function public.admin_remove_post(uuid) from public;
grant execute on function public.admin_remove_post(uuid) to authenticated;
revoke all on function public.admin_set_post_featured(uuid, boolean) from public;
grant execute on function public.admin_set_post_featured(uuid, boolean) to authenticated;
revoke all on function public.admin_review_report(uuid, public.report_status) from public;
grant execute on function public.admin_review_report(uuid, public.report_status) to authenticated;

create or replace function public.submit_safety_report(
  target_post_id uuid,
  target_user_id uuid,
  report_reason text,
  report_description text default null,
  should_block boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  resolved_user_id uuid := target_user_id;
  result_report_id uuid;
begin
  if current_user_id is null or not public.is_active_user(current_user_id) then
    raise exception 'Authentication required';
  end if;
  if nullif(trim(report_reason), '') is null then
    raise exception 'A report reason is required';
  end if;

  if target_post_id is not null then
    select user_id into resolved_user_id from public.posts where id = target_post_id;
    if resolved_user_id is null then
      raise exception 'Post not found';
    end if;
  end if;
  if resolved_user_id is null then
    raise exception 'A post or user must be reported';
  end if;
  if resolved_user_id = current_user_id then
    raise exception 'You cannot report your own account or post';
  end if;

  insert into public.reports (
    reporter_id,
    reported_user_id,
    post_id,
    reason,
    description
  ) values (
    current_user_id,
    resolved_user_id,
    target_post_id,
    trim(report_reason),
    nullif(trim(report_description), '')
  )
  returning id into result_report_id;

  if should_block then
    insert into public.blocked_users (blocker_id, blocked_user_id)
    values (current_user_id, resolved_user_id)
    on conflict (blocker_id, blocked_user_id) do nothing;
  end if;

  return result_report_id;
end;
$$;

revoke all on function public.submit_safety_report(uuid, uuid, text, text, boolean) from public;
grant execute on function public.submit_safety_report(uuid, uuid, text, text, boolean) to authenticated;

create or replace view public.admin_posts
with (security_invoker = false)
as
select
  posts.id,
  posts.user_id,
  profiles.full_name as owner_name,
  posts.post_type,
  posts.title,
  posts.category,
  posts.work_type,
  posts.created_at,
  posts.is_featured
from public.posts
join public.profiles on profiles.id = posts.user_id
where public.is_admin();

revoke all on public.admin_posts from public;
grant select on public.admin_posts to authenticated;

create or replace view public.public_profiles
with (security_invoker = false)
as
select id, full_name, avatar_url, bio, skills, portfolio_url, location, verification_status, created_at
from public.profiles
where not is_banned
  and (
    auth.uid() is null
    or id = auth.uid()
    or not exists (
      select 1
      from public.blocked_users blocked
      where (blocked.blocker_id = auth.uid() and blocked.blocked_user_id = profiles.id)
         or (blocked.blocker_id = profiles.id and blocked.blocked_user_id = auth.uid())
    )
  );

revoke all on public.public_profiles from public;
grant select on public.public_profiles to anon, authenticated;

drop policy if exists "Posts are public" on public.posts;
create policy "Posts are public"
on public.posts for select using (true);
drop policy if exists "Users create allowed posts" on public.posts;
create policy "Users create allowed posts"
on public.posts for insert with check (
  user_id = auth.uid()
  and public.is_active_user()
  and (
    work_type = 'online'
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and verification_status = 'approved' and offline_job_access
    )
  )
);
drop policy if exists "Owners update posts" on public.posts;
create policy "Owners update posts"
on public.posts for update
using ((user_id = auth.uid() and public.is_active_user()) or public.is_admin())
with check ((user_id = auth.uid() and public.is_active_user()) or public.is_admin());
drop policy if exists "Owners delete posts" on public.posts;
create policy "Owners delete posts"
on public.posts for delete using ((user_id = auth.uid() and public.is_active_user()) or public.is_admin());

create or replace view public.public_posts
with (security_invoker = false)
as
select
  posts.id,
  posts.user_id,
  posts.post_type,
  posts.title,
  posts.description,
  posts.category,
  posts.budget_or_price,
  posts.work_type,
  case
    when posts.work_type = 'online' then posts.location
    when exists (
      select 1
      from public.profiles viewer
      join public.profiles owner on owner.id = posts.user_id
      where viewer.id = auth.uid()
        and viewer.verification_status = 'approved'
        and viewer.offline_job_access
        and owner.verification_status = 'approved'
        and owner.offline_job_access
    ) then posts.location
    else null
  end as location,
  posts.deadline,
  posts.required_skills,
  posts.portfolio_url,
  posts.image_url,
  posts.created_at,
  posts.updated_at,
  posts.is_featured
from public.posts
where exists (
  select 1 from public.profiles owner
  where owner.id = posts.user_id and not owner.is_banned
)
and (
  auth.uid() is null
  or posts.user_id = auth.uid()
  or not exists (
    select 1
    from public.blocked_users blocked
    where (blocked.blocker_id = auth.uid() and blocked.blocked_user_id = posts.user_id)
       or (blocked.blocker_id = posts.user_id and blocked.blocked_user_id = auth.uid())
  )
);

revoke select on public.posts from anon, authenticated;
revoke all on public.public_posts from public;
grant select on public.public_posts to anon, authenticated;

drop policy if exists "Participants read chats" on public.chats;
create policy "Participants read chats"
on public.chats for select using (
  public.is_admin()
  or (
    auth.uid() in (participant_one_id, participant_two_id)
    and not exists (
      select 1 from public.blocked_users blocked
      where (blocked.blocker_id = participant_one_id and blocked.blocked_user_id = participant_two_id)
         or (blocked.blocker_id = participant_two_id and blocked.blocked_user_id = participant_one_id)
    )
  )
);
drop policy if exists "Users create chats" on public.chats;
create policy "Users create chats"
on public.chats for insert with check (auth.uid() in (participant_one_id, participant_two_id));
revoke insert on public.chats from authenticated;
drop policy if exists "Participants read messages" on public.messages;
create policy "Participants read messages"
on public.messages for select using (
  public.is_admin()
  or public.can_message_chat(messages.chat_id, auth.uid())
);
drop policy if exists "Participants send messages" on public.messages;
create policy "Participants send messages"
on public.messages for insert with check (
  sender_id = auth.uid()
  and public.can_message_chat(messages.chat_id, auth.uid())
);

drop policy if exists "Users submit and read own verification" on public.verification_requests;
create policy "Users submit and read own verification"
on public.verification_requests for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "Users submit verification" on public.verification_requests;
create policy "Users submit verification"
on public.verification_requests for insert with check (
  user_id = auth.uid()
  and public.is_active_user()
  and status = 'pending'
  and rejection_reason is null
  and reviewed_by_admin_id is null
  and reviewed_at is null
);
drop policy if exists "Admins review verification" on public.verification_requests;
create policy "Admins review verification"
on public.verification_requests for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users create reports" on public.reports;
create policy "Users create reports"
on public.reports for insert with check (reporter_id = auth.uid() and public.is_active_user());
revoke insert on public.reports from authenticated;
drop policy if exists "Users read own reports" on public.reports;
create policy "Users read own reports"
on public.reports for select using (reporter_id = auth.uid() or public.is_admin());
drop policy if exists "Admins manage reports" on public.reports;
create policy "Admins manage reports"
on public.reports for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users manage own blocks" on public.blocked_users;
create policy "Users manage own blocks"
on public.blocked_users for all
using (blocker_id = auth.uid() and public.is_active_user())
with check (blocker_id = auth.uid() and public.is_active_user());
revoke insert on public.blocked_users from authenticated;
drop policy if exists "Admins read audit logs" on public.admin_audit_logs;
create policy "Admins read audit logs"
on public.admin_audit_logs for select using (public.is_admin());
drop policy if exists "Admins create audit logs" on public.admin_audit_logs;
create policy "Admins create audit logs"
on public.admin_audit_logs for insert with check (public.is_admin() and admin_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verification-private',
  'verification-private',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own verification files" on storage.objects;
create policy "Users upload own verification files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'verification-private'
  and public.is_active_user()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Admins view verification files" on storage.objects;
create policy "Admins view verification files"
on storage.objects for select to authenticated
using (bucket_id = 'verification-private' and public.is_admin());

drop policy if exists "Users delete own unreviewed verification files" on storage.objects;
create policy "Users delete own unreviewed verification files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'verification-private'
  and (storage.foldername(name))[1] = auth.uid()::text
  and not exists (
    select 1
    from public.verification_requests request
    where request.user_id = auth.uid()
      and name in (request.ktp_image_path, request.selfie_image_path)
  )
);

drop policy if exists "Users upload own post images" on storage.objects;
create policy "Users upload own post images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'post-images'
  and public.is_active_user()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own post images" on storage.objects;
create policy "Users update own post images"
on storage.objects for update to authenticated
using (
  bucket_id = 'post-images'
  and public.is_active_user()
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'post-images'
  and public.is_active_user()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own post images" on storage.objects;
create policy "Users delete own post images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'post-images'
  and (((storage.foldername(name))[1] = auth.uid()::text and public.is_active_user()) or public.is_admin())
);

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and public.is_active_user()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and public.is_active_user()
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and public.is_active_user()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (((storage.foldername(name))[1] = auth.uid()::text and public.is_active_user()) or public.is_admin())
);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'messages'
     ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;



