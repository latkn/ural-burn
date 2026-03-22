# Онбординг Уральского бёрна

Приложение онбординга и регистрации Burn-профиля. Регистрация — **в конце**, после успешной аттестации.

**Стек:** Vue 3, Vite, Tailwind CSS, Supabase.

## Запуск

```bash
cd onboarding
cp env.example .env
# Заполните .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Откройте http://localhost:5173/ (или http://localhost:5173/onboarding/ при `base: '/onboarding/'`).

## Сборка

```bash
npm run build
```

Содержимое `dist/` выложить на хостинг по пути `/onboarding/` (или настроить `VITE_BASE_URL`).

## Supabase

1. Создайте проект в [Supabase](https://supabase.com).
2. В SQL Editor выполните миграцию из репозитория: `supabase/migrations/001_burn_profiles.sql` (она лежит в корне проекта, папка `supabase/`).
3. В настройках проекта возьмите URL и anon key, подставьте в `.env`.

## Поток

1. **Старт** — выбор: новичок / с опытом.
2. **Новички:** инфо-страницы → мини-квиз → аттестация.
3. **С опытом:** сразу аттестация (тест знаний + блок «я согласен»).
4. При успехе — **регистрация** (ФИО, телефон, Telegram, email) → проверка дубликатов → создание профиля в Supabase, уникальный код.
5. **Успех** — показ кода и ссылки на чат.

Прогресс до регистрации хранится в `localStorage`.

## Связь с основным сайтом

На главной (`site/index.html`) кнопка «Начать онбординг» / «Создать Burn-профиль и начать» должна вести на URL приложения онбординга (например `https://your-domain.ru/onboarding/`).
