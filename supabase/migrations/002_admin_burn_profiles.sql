-- Admin access for burn_profiles table (RLS)
--
-- Цель: чтобы админ-пользователь мог читать `public.burn_profiles`, а остальные нет.
-- Админ определяется через `public.admin_users` (user_id = auth.users.id).

-- Таблица админов
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Проверка: является ли текущий auth.users(id) админом
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists(
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  );
end;
$$;

-- Включаем RLS и разрешаем SELECT только админам
alter table public.burn_profiles enable row level security;

grant select on table public.burn_profiles to authenticated;

drop policy if exists "admin_can_read_burn_profiles" on public.burn_profiles;
create policy "admin_can_read_burn_profiles"
on public.burn_profiles
for select
to authenticated
using (public.is_admin());

-- Явно разрешаем execute для функции
grant execute on function public.is_admin() to authenticated;

