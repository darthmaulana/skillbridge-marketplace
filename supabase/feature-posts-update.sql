alter table public.posts
add column if not exists is_featured boolean not null default false;

drop policy if exists "Owners update posts" on public.posts;
create policy "Owners update posts"
on public.posts for update
using ((user_id = auth.uid() and public.is_active_user()) or public.is_admin())
with check ((user_id = auth.uid() and public.is_active_user()) or public.is_admin());

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

revoke all on function public.admin_set_post_featured(uuid, boolean) from public;
grant execute on function public.admin_set_post_featured(uuid, boolean) to authenticated;

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

notify pgrst, 'reload schema';
