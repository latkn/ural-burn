# Проектирование системы онбординга

Технический дизайн онбординга и связка с основным сайтом. Стек: **Vue 3**, **Vite**, **Supabase**, **Tailwind CSS**.

---

## 1. Порядок потока: регистрация в конце

Регистрация (Burn-профиль) — **после** успешной аттестации, когда человек уже готов стать бёрнером.

| Шаг | Что происходит |
|-----|-----------------|
| 1 | Пользователь переходит на онбординг (с основного сайта по кнопке «Начать онбординг» / «Стать участником»). |
| 2 | Выбор пути: **«Я новичок»** или **«У меня есть опыт бёрнов/кемпов»**. Прогресс сохраняем в `localStorage` (анонимно). |
| 3 | **Новички:** инфо-страницы → мини-квиз → аттестация (тест знаний + блок «я согласен»). **С опытом:** сразу аттестация. |
| 4 | При **успешной** аттестации показываем экран: «Ты готов. Заверши регистрацию — создай Burn-профиль.» → форма (ФИО, телефон, Telegram, email). |
| 5 | Проверка дубликатов (телефон / Telegram / email уже в базе?) → если да, сообщение «такой профиль уже есть», не создаём второй. Если нет — создаём запись в Supabase, выдаём уникальный код, показываем ссылку на чат и сохраняем флаг «чат выдан». |
| 6 | При **неуспешной** аттестации — сообщение «аттестация не пройдена», ссылка на материалы, возможность пройти снова (повтор без регистрации). |

Никакого логина до конца: пока не прошёл аттестацию, аккаунт не создаётся. После аттестации один раз вводит данные и получает профиль + чат.

---

## 2. Связь с основным сайтом

- **Основной сайт** (сейчас `site/` — статичный HTML) содержит кнопку/ссылку: **«Начать онбординг»** или **«Стать участником»**.
- Ссылка ведёт на **приложение онбординга** (Vue): например `https://uralburn.ru/onboarding/` или отдельный поддомен. В разработке — `http://localhost:5173/` (Vite).
- После деплоя в `site/index.html` заменить `href="#"` у кнопки «Создать Burn-профиль и начать» на URL онбординга. Текст в блоке «Как стать участником» обновить: сначала онбординг и аттестация, затем регистрация (Burn-профиль) в конце.

---

## 3. Структура приложения (Vue 3 + Vite)

```
onboarding/
├── index.html
├── vite.config.ts
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── env.example
├── public/
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── router/
│   │   └── index.ts
│   ├── views/           # страницы потока
│   │   ├── StartView.vue        # выбор: новичок / с опытом
│   │   ├── InfoView.vue         # инфо-страницы (только для новичков)
│   │   ├── QuizView.vue         # мини-квиз (только для новичков)
│   │   ├── AttestationView.vue  # тест знаний + блок согласия (все)
│   │   ├── RegisterView.vue     # форма Burn-профиля (после успеха)
│   │   └── SuccessView.vue      # ссылка на чат, код
│   ├── components/
│   │   ├── ProgressBar.vue
│   │   ├── QuestionCard.vue
│   │   └── ...
│   ├── composables/
│   │   ├── useOnboardingState.ts   # прогресс в localStorage + шаг
│   │   └── useSupabase.ts
│   ├── data/
│   │   ├── infoPages.ts
│   │   ├── quizQuestions.ts
│   │   └── attestationQuestions.ts
│   └── lib/
│       └── supabase.ts
└── supabase/
    └── migrations/
        └── 001_burn_profiles.sql
```

Роуты (пример):

- `/` — редирект на `/onboarding` или сразу StartView.
- `/onboarding` — StartView (выбор пути).
- `/onboarding/info` — инфо (только для новичков).
- `/onboarding/quiz` — квиз (только для новичков).
- `/onboarding/attestation` — аттестация (все).
- `/onboarding/register` — форма регистрации (доступ только если аттестация пройдена в этой сессии).
- `/onboarding/success` — успех, ссылка на чат (и код).

Доступ к `/register` и `/success` — только при наличии в state флага «аттестация пройдена»; иначе редирект на начало или аттестацию.

---

## 4. Supabase: схема и политики

### 4.1 Таблица `burn_profiles`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `full_name` | `text` | NOT NULL, полное ФИО |
| `phone` | `text` | NOT NULL, уникальный |
| `telegram` | `text` | NOT NULL, уникальный (ник или ссылка) |
| `email` | `text` | NOT NULL, уникальный |
| `unique_code` | `text` | NOT NULL, UNIQUE, формат `UB-2026-XXXX` |
| `attestation_passed_at` | `timestamptz` | когда прошёл аттестацию (при создании профиля) |
| `chat_link_sent_at` | `timestamptz` | когда показана ссылка на чат (опционально) |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

Проверка дубликатов: перед вставкой проверять наличие записи с таким же `phone` OR `telegram` OR `email`. Уникальные индексы по `phone`, `telegram`, `email`.

Уникальный код: генерировать при создании профиля, например `UB-${YEAR}-${random4digits}` или последовательность.

### 4.2 Доступ

- **Анонимный (клиент):** только `INSERT` в `burn_profiles` (создание профиля после аттестации). Никакого чтения списков. Можно через RPC `create_burn_profile(full_name, phone, telegram, email)` который проверяет дубликаты и генерирует код.
- **Админка:** отдельный доступ (Supabase Auth или отдельное приложение) с чтением `burn_profiles` по RLS или отдельная роль. В этом документе не реализуем админку, только таблицу и создание профиля.

### 4.3 RPC для создания профиля (рекомендуется)

Функция `create_burn_profile(p_full_name text, p_phone text, p_telegram text, p_email text)`:

1. Проверить, что нет строки с `phone = p_phone` OR `telegram = p_telegram` OR `email = p_email`.
2. Если есть — вернуть ошибку (например, код и сообщение «already_exists»).
3. Сгенерировать `unique_code`, вставить строку с `attestation_passed_at = now()`, вернуть `{ id, unique_code }`.

Так логика дубликатов и кода — на сервере, клиент только вызывает RPC с четырьмя полями.

---

## 5. Состояние онбординга (localStorage)

Чтобы не терять прогресс при перезагрузке (и при этом не создавать аккаунт до конца), храним в `localStorage` ключ, например `uralburn_onboarding`:

```json
{
  "path": "newcomer" | "experienced",
  "infoSeen": true,
  "quizPassed": true,
  "attestationPassed": true,
  "attestationPassedAt": "2026-03-15T12:00:00Z"
}
```

- `path` — выбранный путь.
- `infoSeen` — новичок прошёл все инфо-страницы.
- `quizPassed` — новичок сдал мини-квиз.
- `attestationPassed` — тест знаний + блок согласия сданы (для всех).
- `attestationPassedAt` — время прохождения (можно подставлять при создании профиля).

При успешной регистрации можно очистить или оставить для аналитики. При заходе на `/onboarding/register` без `attestationPassed` — редирект на `/onboarding/attestation`.

---

## 6. Стек и команды

- **Vue 3** (Composition API), **Vite**, **Vue Router**.
- **Tailwind CSS** для стилей (конфиг под бренд Уральского бёрна при желании).
- **Supabase JS client**: инициализация по `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`; вызов RPC `create_burn_profile` после заполнения формы регистрации.

Команды:

```bash
cd onboarding
npm install
npm run dev    # разработка
npm run build  # сборка для деплоя
```

Сборка кладётся в `dist/`, деплой — на любой хостинг (Vercel, Netlify, свой сервер) по пути `/onboarding` или в корень поддомена.

---

## 7. Что сделано

1. **Миграция Supabase** — `supabase/migrations/001_burn_profiles.sql`: таблица `burn_profiles`, RPC `create_burn_profile` с проверкой дубликатов и генерацией кода `UB-YYYY-XXXX`.
2. **Проект Vue 3 + Vite + Tailwind** в `onboarding/`: Vue Router, Supabase client, composable `useOnboardingState` (localStorage).
3. **Экраны:** StartView (выбор пути) → InfoView (инфо для новичков) → QuizView (мини-квиз) → AttestationView (тест знаний + согласие) → RegisterView (форма Burn-профиля) → SuccessView (код + ссылка на чат). Доступ к `/register` и `/success` только при пройденной аттестации.
4. **Основной сайт** (`site/index.html`): обновлён текст «Как стать участником» (сначала онбординг, регистрация в конце), кнопка ведёт на `./onboarding/`.

## 8. Что делать дальше

- Добавить полный банк вопросов квиза и аттестации (см. `docs/onboarding-spec.md`, `docs/glossary-burner.md`).
- Заполнить контент инфо-страниц из спецификации и словарика.
- В Supabase Dashboard применить миграцию, создать проект и прописать URL + anon key в `onboarding/.env`.
- Задать `VITE_CHAT_LINK` в `.env` для ссылки на чат на экране успеха.
- Деплой: собрать `npm run build` в `onboarding/`, выложить `dist/` по пути `/onboarding/` на хостинге основного сайта (или отдельный поддомен).

---

*Документ можно дополнять: конкретные формулировки вопросов, дизайн экранов, настройка базового URL для продакшена.*
