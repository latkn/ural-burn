<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const pdfUrl = computed(() => `${import.meta.env.BASE_URL}pdf/how-to-make-camp.pdf`)

const videoVasya = 'https://www.youtube.com/embed/4reTLCMjmR4'

const videoYasenRutubeEmbed =
  'https://rutube.ru/play/embed/02d6c095f9ed8cec8a2dedb2b0203613/'
const videoYasenRutubePage =
  'https://rutube.ru/video/02d6c095f9ed8cec8a2dedb2b0203613/'
const videoYasenYoutube = 'https://www.youtube.com/watch?v=9gIQn8p28v8'
</script>

<template>
  <div class="space-y-12">
    <div>
      <h1 class="font-display text-4xl sm:text-5xl text-burn-cream">Как сделать кемп</h1>
      <p class="mt-3 text-lg text-burn-cream/70">
        Материалы про организацию лагеря на бёрнерских мероприятиях: презентация и видео.
      </p>
    </div>

    <!-- 1. Презентация -->
    <section class="space-y-4">
      <h2 class="font-display text-2xl sm:text-3xl text-burn-cream">
        Презентация «Как сделать свой кемп?»
      </h2>
      <p class="text-lg leading-relaxed text-burn-cream/85">
        Юрий Велтистов и Astro Terra — слайды про то, как подойти к созданию своего кэмпа.
      </p>
      <div class="flex flex-wrap gap-3">
        <a
          :href="pdfUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center rounded-xl bg-burn-orange px-5 py-3 font-semibold text-burn-black transition hover:bg-burn-orangeLight"
        >
          Открыть PDF в новой вкладке
        </a>
        <a
          :href="pdfUrl"
          download
          class="inline-flex items-center justify-center rounded-xl border-2 border-burn-border px-5 py-3 font-semibold text-burn-cream transition hover:border-burn-orange/50"
        >
          Скачать
        </a>
      </div>
      <div
        class="overflow-hidden rounded-xl border border-burn-border bg-burn-black/20"
        style="min-height: 70vh"
      >
        <iframe
          :src="pdfUrl"
          class="h-[70vh] w-full"
          title="Презентация «Как сделать свой кемп?»"
        />
      </div>
    </section>

    <!-- 2. Вася Румянцев -->
    <section class="space-y-4 rounded-2xl border border-burn-border bg-burn-card/40 p-6 sm:p-8">
      <h2 class="font-display text-2xl sm:text-3xl text-burn-cream">
        Как сделать бёрнерский кэмп? Мастер-класс и советы для новичков
      </h2>
      <p class="text-sm font-medium uppercase tracking-wide text-burn-muted">
        Вася Румянцев · YouTube
      </p>
      <div class="relative w-full overflow-hidden rounded-xl border border-burn-border pt-[56.25%]">
        <iframe
          class="absolute inset-0 h-full w-full"
          :src="videoVasya"
          title="Как сделать бёрнерский кэмп — Вася Румянцев"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        />
      </div>
      <div class="space-y-4 text-lg leading-relaxed text-burn-cream/85">
        <p>
          Видео от Васи, лида
          знаменитого кемпа Шишовка, про то, как же можно сделать свой кэмп.
        </p>
        <p>
          Планирование, организация, управление командой и множество других важных нюансов, о которых
          очень полезно знать, если вы решились на такое приключение, как создание собственного лагеря
          (кэмпа). Вася делится опытом, накопленным на множестве бёрнерских мероприятий, в которых
          принимал участие в роли участника организационной команды и лида кэмпа.
        </p>
        <p class="text-base text-burn-cream/60">
          Дисклеймер: это личное мнение Васи, кемпы бывают разные и лиды тоже
        </p>
      </div>
      <p>
        <a
          href="https://youtu.be/4reTLCMjmR4"
          target="_blank"
          rel="noopener noreferrer"
          class="text-burn-orange underline underline-offset-2 hover:text-burn-orangeLight"
        >
          Открыть на YouTube
        </a>
      </p>
    </section>

    <!-- 3. Школа бёрнеров «Ясень» -->
    <section class="space-y-4">
      <h2 class="font-display text-2xl sm:text-3xl text-burn-cream">
        Школа бёрнеров «Ясень»: как построить лагерь
      </h2>
      <p class="text-sm font-medium uppercase tracking-wide text-burn-muted">
        Маша Вышегородцева, Оля Опанасенко (Costume Camp), Вася Румянцев (Шишовка)
      </p>
      <p class="text-lg leading-relaxed text-burn-cream/85">
        Разговор про то, как построить лагерь на бёрнерских мероприятиях. Кэмп-лиды делятся
        накопленным опытом организации лагеря и участия в мероприятиях сообщества Burning Man.
      </p>
      <div class="relative w-full overflow-hidden rounded-xl border border-burn-border pt-[56.25%]">
        <iframe
          class="absolute inset-0 h-full w-full"
          :src="videoYasenRutubeEmbed"
          title="Школа бёрнеров Ясень — как построить лагерь на RuTube"
          allow="clipboard-write; autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowfullscreen
        />
      </div>
      <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-burn-cream/85">
        <a
          :href="videoYasenRutubePage"
          target="_blank"
          rel="noopener noreferrer"
          class="text-burn-orange underline underline-offset-2 hover:text-burn-orangeLight"
        >
          Смотреть на RuTube
        </a>
        <span class="text-burn-muted" aria-hidden="true">·</span>
        <a
          :href="videoYasenYoutube"
          target="_blank"
          rel="noopener noreferrer"
          class="text-burn-orange underline underline-offset-2 hover:text-burn-orangeLight"
        >
          Смотреть на YouTube
        </a>
      </p>
    </section>

    <p class="text-sm text-burn-cream/60">
      <RouterLink to="/" class="underline">На главную</RouterLink>
    </p>
  </div>
</template>
