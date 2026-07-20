drop policy if exists "Admin can view all profiles" on public.profiles;
drop policy if exists "Admin can update all profiles" on public.profiles;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "Admin can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admin can update all profiles"
  on public.profiles for update
  using (public.is_admin());
