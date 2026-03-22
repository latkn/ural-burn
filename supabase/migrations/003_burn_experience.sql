-- Burn experience for profiles:
-- - virgin (новичок) / experienced (опытный)
-- - история прошлых burn-ивентов для опытных участников

alter table public.burn_profiles
  add column if not exists burn_experience_level text not null default 'virgin'
  check (burn_experience_level in ('virgin', 'experienced'));

create table if not exists public.burn_profile_history (
  id uuid primary key default gen_random_uuid(),
  burn_profile_id uuid not null references public.burn_profiles(id) on delete cascade,
  burn_year integer not null check (burn_year >= 1986 and burn_year <= 2100),
  burn_name text not null,
  camp_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_burn_profile_history_profile_id
  on public.burn_profile_history(burn_profile_id);

create or replace function public.create_burn_profile(
  p_full_name text,
  p_phone text,
  p_telegram text,
  p_email text,
  p_burn_experience_level text default 'virgin',
  p_burn_history jsonb default '[]'::jsonb
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
  v_item jsonb;
  v_burn_year integer;
  v_burn_name text;
  v_camp_name text;
begin
  v_year := to_char(now(), 'YYYY');

  if p_burn_experience_level not in ('virgin', 'experienced') then
    return jsonb_build_object(
      'ok', false,
      'error', 'invalid_experience_level',
      'message', 'Укажите корректный уровень burn-опыта.'
    );
  end if;

  if p_burn_experience_level = 'experienced' then
    if jsonb_typeof(p_burn_history) <> 'array' or jsonb_array_length(p_burn_history) = 0 then
      return jsonb_build_object(
        'ok', false,
        'error', 'empty_burn_history',
        'message', 'Для опытного бёрнера нужно добавить минимум один burn-опыт.'
      );
    end if;

    -- Предварительная валидация всех записей опыта
    for v_item in select * from jsonb_array_elements(p_burn_history)
    loop
      v_burn_year := nullif(trim(coalesce(v_item ->> 'year', '')), '')::integer;
      v_burn_name := trim(coalesce(v_item ->> 'burn_name', ''));
      v_camp_name := trim(coalesce(v_item ->> 'camp_name', ''));

      if v_burn_year is null or v_burn_name = '' or v_camp_name = '' then
        return jsonb_build_object(
          'ok', false,
          'error', 'invalid_burn_history',
          'message', 'Заполните год, название бёрна и кемп для каждой записи опыта.'
        );
      end if;
    end loop;
  end if;

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

  insert into burn_profiles (
    full_name,
    phone,
    telegram,
    email,
    unique_code,
    attestation_passed_at,
    burn_experience_level,
    updated_at
  )
  values (
    trim(p_full_name),
    trim(p_phone),
    trim(p_telegram),
    trim(lower(p_email)),
    v_code,
    now(),
    p_burn_experience_level,
    now()
  )
  returning id into v_id;

  if p_burn_experience_level = 'experienced' then
    for v_item in select * from jsonb_array_elements(p_burn_history)
    loop
      v_burn_year := nullif(trim(coalesce(v_item ->> 'year', '')), '')::integer;
      v_burn_name := trim(coalesce(v_item ->> 'burn_name', ''));
      v_camp_name := trim(coalesce(v_item ->> 'camp_name', ''));

      insert into public.burn_profile_history (burn_profile_id, burn_year, burn_name, camp_name)
      values (v_id, v_burn_year, v_burn_name, v_camp_name);
    end loop;
  end if;

  return jsonb_build_object(
    'ok', true,
    'id', v_id,
    'unique_code', v_code
  );
end;
$$;

grant execute on function public.create_burn_profile(text, text, text, text, text, jsonb) to anon;
grant execute on function public.create_burn_profile(text, text, text, text, text, jsonb) to authenticated;

