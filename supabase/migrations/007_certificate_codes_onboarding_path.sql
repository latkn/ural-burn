-- Фиксируем тип прохождения для сертификата:
-- newcomer -> прошёл обучение по главам + тест
-- experienced -> сразу тест

alter table public.certificate_codes
  add column if not exists onboarding_path text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'certificate_codes_onboarding_path_chk'
      and conrelid = 'public.certificate_codes'::regclass
  ) then
    alter table public.certificate_codes
      add constraint certificate_codes_onboarding_path_chk
      check (onboarding_path is null or onboarding_path in ('newcomer', 'experienced'));
  end if;
end $$;

create index if not exists idx_certificate_codes_onboarding_path
  on public.certificate_codes (onboarding_path);

create or replace function public.submit_attestation(
  p_knowledge_answers integer[],
  p_agreement_all boolean,
  p_onboarding_path text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_len int;
  v_correct integer[] := array[1,1,1,1,1,1,1,1,1,1,1];
  v_need int;
  v_count int := 0;
  v_i int;
  v_suffix text := '';
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_ch text;
  v_code text;
  v_year text;
  v_passed_at timestamptz := now();
  v_path text;
begin
  if not coalesce(p_agreement_all, false) then
    return jsonb_build_object(
      'ok', false,
      'error', 'agreement_required',
      'message', 'Нужно подтвердить все пункты согласия.'
    );
  end if;

  v_len := coalesce(array_length(p_knowledge_answers, 1), 0);
  if v_len <> 11 then
    return jsonb_build_object(
      'ok', false,
      'error', 'invalid_answers_length',
      'message', 'Неверное количество ответов.'
    );
  end if;

  v_need := v_len;

  for v_i in 1..11 loop
    if p_knowledge_answers[v_i] is null
       or p_knowledge_answers[v_i] < 0
       or p_knowledge_answers[v_i] > 2 then
      return jsonb_build_object(
        'ok', false,
        'error', 'invalid_answer_index',
        'message', 'Некорректный ответ.'
      );
    end if;
    if p_knowledge_answers[v_i] = v_correct[v_i] then
      v_count := v_count + 1;
    end if;
  end loop;

  if v_count < v_need then
    return jsonb_build_object(
      'ok', false,
      'error', 'knowledge_failed',
      'message', 'Тест не пройден. Нужны все правильные ответы.'
    );
  end if;

  v_path := case
    when p_onboarding_path = 'newcomer' then 'newcomer'
    when p_onboarding_path = 'experienced' then 'experienced'
    else null
  end;

  v_year := to_char(v_passed_at, 'YYYY');

  for v_attempt in 1..12 loop
    v_suffix := '';
    for v_i in 1..6 loop
      v_ch := substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
      v_suffix := v_suffix || v_ch;
    end loop;
    v_code := 'UB-' || v_year || '-' || v_suffix;
    begin
      insert into public.certificate_codes (code, created_at, onboarding_path)
      values (v_code, v_passed_at, v_path);
      exit;
    exception
      when unique_violation then
        if v_attempt = 12 then
          return jsonb_build_object(
            'ok', false,
            'error', 'code_collision',
            'message', 'Не удалось выдать код. Попробуйте ещё раз.'
          );
        end if;
    end;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'certificate_code', v_code,
    'attestation_passed_at', v_passed_at
  );
end;
$$;

create or replace function public.submit_attestation(
  p_knowledge_answers integer[],
  p_agreement_all boolean
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.submit_attestation(p_knowledge_answers, p_agreement_all, null);
$$;

grant execute on function public.submit_attestation(integer[], boolean) to anon;
grant execute on function public.submit_attestation(integer[], boolean) to authenticated;
grant execute on function public.submit_attestation(integer[], boolean, text) to anon;
grant execute on function public.submit_attestation(integer[], boolean, text) to authenticated;

comment on function public.submit_attestation(integer[], boolean, text) is
  'Проверка ответов аттестации (100% верных), выдача кода сертификата и фиксация пути прохождения.';
