# Admin access setup (burn_profiles)

Админка в приложении читает таблицу `public.burn_profiles` через Supabase RLS.
Доступ дается только тем пользователям Supabase Auth, чьи `auth.users.id` находятся в таблице `public.admin_users`.

Перед настройкой админки примените миграции:
- `supabase/migrations/002_admin_burn_profiles.sql`
- `supabase/migrations/003_burn_experience.sql`
- `supabase/migrations/004_certificate_codes.sql` — коды сертификатов онбординга (без ПДн) и проверка в админке
- `supabase/migrations/005_submit_attestation.sql` — аттестация на сервере (`submit_attestation`), выдача кода только после проверки ответов; публичный `register_certificate_code` отключён

## 1) Создайте админ-пользователя в Supabase Auth
В Supabase Dashboard:
`Authentication` -> `Users` -> `Add user` (или через Sign Up).

Запомните `email` и `password` этого админа — их вводите в экране `admin/login`.

## 2) Узнайте `auth.users.id` для этого email
В Supabase SQL Editor выполните:
```sql
select id, email
from auth.users
where email = 'admin@example.com';
```

Скопируйте `id` (UUID).

## 3) Добавьте UUID в `public.admin_users`
```sql
insert into public.admin_users (user_id)
values ('<PASTE_AUTH_USER_UUID>');
```

## 4) Проверьте админку
Откройте в браузере:
- в dev: `http://localhost:<port>/admin/login`
- при деплое с base path `/onboarding/`: `/onboarding/admin/login`

Залогиньтесь и убедитесь, что видите список профилей участников.
Для опытных бёрнеров в админке появятся ачивки с иконками и tooltip с опытом (год, название burn, кемп).

## Проверка кода сертификата онбординга
В админке сверху есть блок **«Проверка кода сертификата»**: введите код в формате `UB-ГГГГ-XXXXXX` (как в PDF участника).
В таблице `certificate_codes` хранятся только код и дата регистрации кода — без имён.

