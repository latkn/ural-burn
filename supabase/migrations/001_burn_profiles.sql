-- Burn profiles: регистрация в конце онбординга (после успешной аттестации)
-- Уникальный код UB-{YEAR}-{4 цифры}, проверка дубликатов по phone, telegram, email

create table if not exists public.burn_profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  telegram text not null,
  email text not null,
  unique_code text not null,
  attestation_passed_at timestamptz not null default now(),
  chat_link_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint burn_profiles_phone_key unique (phone),
  constraint burn_profiles_telegram_key unique (telegram),
  constraint burn_profiles_email_key unique (email),
  constraint burn_profiles_unique_code_key unique (unique_code)
);

create index if not exists idx_burn_profiles_phone on public.burn_profiles (phone);
create index if not exists idx_burn_profiles_telegram on public.burn_profiles (telegram);
create index if not exists idx_burn_profiles_email on public.burn_profiles (email);
create index if not exists idx_burn_profiles_attestation on public.burn_profiles (attestation_passed_at) where attestation_passed_at is not null;

comment on table public.burn_profiles is 'Burn-профили участников Уральского бёрна (создаются после успешной аттестации)';

-- RPC: создание профиля с проверкой дубликатов и генерацией кода
create or replace function public.create_burn_profile(
  p_full_name text,
  p_phone text,
  p_telegram text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
  v_code text;
  v_year text;
  v_id uuid;
begin
  v_year := to_char(now(), 'YYYY');

  -- Проверка дубликатов
  select exists(
    select 1 from burn_profiles
    where phone = trim(p_phone)
       or telegram = trim(p_telegram)
       or email = trim(lower(p_email))
  ) into v_exists;

  if v_exists then
    return jsonb_build_object(
      'ok', false,
      'error', 'already_exists',
      'message', 'Профиль с таким телефоном, Telegram или email уже зарегистрирован.'
    );
  end if;

  -- Генерация уникального кода UB-YYYY-XXXX (4 случайные цифры)
  loop
    v_code := 'UB-' || v_year || '-' || lpad(floor(random() * 10000)::text, 4, '0');
    if not exists (select 1 from burn_profiles where unique_code = v_code) then
      exit;
    end if;
  end loop;

  insert into burn_profiles (full_name, phone, telegram, email, unique_code, attestation_passed_at, updated_at)
  values (
    trim(p_full_name),
    trim(p_phone),
    trim(p_telegram),
    trim(lower(p_email)),
    v_code,
    now(),
    now()
  )
  returning id into v_id;

  return jsonb_build_object(
    'ok', true,
    'id', v_id,
    'unique_code', v_code
  );
end;
$$;

-- Политика: анонимный доступ только на вызов RPC (в Supabase через service role или разрешить anon вызывать эту функцию)
-- По умолчанию RLS отключён для public; если включите RLS на burn_profiles, дайте anon право только на execute create_burn_profile.
-- Чтение burn_profiles для админки — отдельно (другой сервис / роль).

revoke all on table public.burn_profiles from anon;
revoke all on table public.burn_profiles from authenticated;
grant execute on function public.create_burn_profile(text, text, text, text) to anon;
grant execute on function public.create_burn_profile(text, text, text, text) to authenticated;
