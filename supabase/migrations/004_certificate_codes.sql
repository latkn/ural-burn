-- Коды сертификатов онбординга: только строка кода и дата фиксации (без имён и ПДн).
-- Регистрация кода — публично после прохождения аттестации (RPC для anon).
-- Проверка кода — только для пользователей из public.admin_users.

create table if not exists public.certificate_codes (
  code text primary key,
  created_at timestamptz not null default now()
);

comment on table public.certificate_codes is 'Коды сертификата онбординга (UB-ГГГГ-XXXXXX), без персональных данных';

create index if not exists idx_certificate_codes_created_at
  on public.certificate_codes (created_at desc);

alter table public.certificate_codes enable row level security;

-- Прямой доступ к таблице не выдаём; только через SECURITY DEFINER RPC ниже.

-- Регистрация кода (идемпотентно: повтор с тем же кодом — ок)
create or replace function public.register_certificate_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  v_code := upper(trim(coalesce(p_code, '')));
  -- Формат как в клиенте: UB-2026-XXXXXX, суффикс — латиница без I/O и цифры 2–9
  if v_code !~ '^UB-[0-9]{4}-[A-Z2-9]{6}$' then
    return jsonb_build_object(
      'ok', false,
      'error', 'invalid_format',
      'message', 'Некорректный формат кода сертификата.'
    );
  end if;

  insert into public.certificate_codes (code)
  values (v_code)
  on conflict (code) do nothing;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.register_certificate_code(text) to anon;
grant execute on function public.register_certificate_code(text) to authenticated;

-- Проверка кода (только админ)
create or replace function public.verify_certificate_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_created timestamptz;
begin
  if not public.is_admin() then
    return jsonb_build_object(
      'ok', false,
      'error', 'forbidden',
      'message', 'Недостаточно прав.'
    );
  end if;

  v_code := upper(trim(coalesce(p_code, '')));
  if v_code = '' then
    return jsonb_build_object('ok', true, 'exists', false);
  end if;

  select cc.created_at into v_created
  from public.certificate_codes cc
  where cc.code = v_code;

  if v_created is null then
    return jsonb_build_object('ok', true, 'exists', false);
  end if;

  return jsonb_build_object(
    'ok', true,
    'exists', true,
    'created_at', v_created
  );
end;
$$;

grant execute on function public.verify_certificate_code(text) to authenticated;
