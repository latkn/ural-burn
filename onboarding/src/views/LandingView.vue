<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import GallerySection from '@/components/GallerySection.vue'
import EmbersOverlay from '@/components/EmbersOverlay.vue'

const img = (path: string) => `${import.meta.env.BASE_URL}images/${path}`

/** Старт события: 23 июля 2026, 00:00 (Екатеринбург, UTC+5) */
const EVENT_START_MS = new Date('2026-07-23T00:00:00+05:00').getTime()

const nowMs = ref(Date.now())
let tick: ReturnType<typeof setInterval> | undefined

const remainingMs = computed(() => Math.max(0, EVENT_START_MS - nowMs.value))

const countdownParts = computed(() => {
  const t = remainingMs.value
  const sec = Math.floor(t / 1000)
  const days = Math.floor(sec / 86400)
  const hours = Math.floor((sec % 86400) / 3600)
  const minutes = Math.floor((sec % 3600) / 60)
  const seconds = sec % 60
  return { days, hours, minutes, seconds }
})

const eventStarted = computed(() => remainingMs.value === 0)

onMounted(() => {
  tick = setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (tick !== undefined) clearInterval(tick)
})
</script>

<template>
  <div class="landing">
    <!-- Искры как фоновый слой по странице, плавно затухают вниз -->
    <EmbersOverlay
      class="fixed inset-0 opacity-95 z-10"
      :strength="28"
      :density="160"
      :fade-start-vh="220"
      :fade-end-vh="560"
    />

    <!-- Первый экран (hero + вступление) -->
    <div class="relative">
      <!-- Hero: картинка на всю ширину -->
      <section class="w-full relative z-0">
        <img
          :src="img('main.jpg')"
          alt="Уральский Бёрн"
          class="w-full h-auto max-h-[90vh] object-cover object-center block"
        />
      </section>

      <!-- Блок с текстом и кнопками -->
      <section class="px-4 py-16 md:py-24 border-b border-burn-border relative z-0">
        <div class="max-w-3xl mx-auto text-center space-y-6 relative z-20">
          <p class="text-lg text-burn-cream/85 leading-relaxed max-w-2xl mx-auto">
            У подножия Уральского горного хребта, на границе между Европой и Азией, в сердце материка
            мы строим на несколько дней место, свободное от политики,
            денежных отношений, ограничений на самовыражение и предвзятых суждений. Место, где рады всем. <br>
            Место, которое мы сами сделаем таким, каким хотим его видеть.
          </p>

          <div v-if="!eventStarted" class="space-y-3">
            <p class="text-burn-cream/80 text-sm sm:text-base">
              До старта:
            </p>
            <div
              class="grid grid-cols-4 gap-1.5 sm:gap-2 max-w-[260px] sm:max-w-xs mx-auto"
            >
              <div class="rounded-md border border-burn-orange/35 bg-burn-black/50 px-0.5 py-1.5 sm:px-2 sm:py-2">
                <div class="font-display text-lg sm:text-2xl text-burn-orange tabular-nums leading-none">
                  {{ countdownParts.days }}
                </div>
                <div class="text-[9px] sm:text-[10px] text-burn-cream/60 mt-1 uppercase tracking-wide">
                  дней
                </div>
              </div>
              <div class="rounded-md border border-burn-orange/35 bg-burn-black/50 px-0.5 py-1.5 sm:px-2 sm:py-2">
                <div class="font-display text-lg sm:text-2xl text-burn-orange tabular-nums leading-none">
                  {{ String(countdownParts.hours).padStart(2, '0') }}
                </div>
                <div class="text-[9px] sm:text-[10px] text-burn-cream/60 mt-1 uppercase tracking-wide">
                  часов
                </div>
              </div>
              <div class="rounded-md border border-burn-orange/35 bg-burn-black/50 px-0.5 py-1.5 sm:px-2 sm:py-2">
                <div class="font-display text-lg sm:text-2xl text-burn-orange tabular-nums leading-none">
                  {{ String(countdownParts.minutes).padStart(2, '0') }}
                </div>
                <div class="text-[9px] sm:text-[10px] text-burn-cream/60 mt-1 uppercase tracking-wide">
                  мин
                </div>
              </div>
              <div class="rounded-md border border-burn-orange/35 bg-burn-black/50 px-0.5 py-1.5 sm:px-2 sm:py-2">
                <div class="font-display text-lg sm:text-2xl text-burn-orange tabular-nums leading-none">
                  {{ String(countdownParts.seconds).padStart(2, '0') }}
                </div>
                <div class="text-[9px] sm:text-[10px] text-burn-cream/60 mt-1 uppercase tracking-wide">
                  сек
                </div>
              </div>
            </div>
          </div>
          <p v-else class="font-display text-base sm:text-lg text-burn-orange">
            Событие уже идёт — увидимся на площадке 🔥
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <!-- <RouterLink
              to="/onboarding"
              class="inline-flex items-center justify-center rounded-xl bg-burn-orange px-8 py-4 font-semibold text-burn-black transition hover:bg-burn-orangeLight"
            >
              Стать участником
            </RouterLink> -->
            <!-- <a
              :href="TG_GROUP"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center rounded-xl border-2 border-burn-orange/60 px-8 py-4 font-semibold text-burn-cream transition hover:border-burn-orange hover:bg-burn-orange/10"
            >
              Группа Wild Tribe в Telegram
            </a> -->
          </div>
        </div>
      </section>
    </div>

    <!-- Уральский Бёрн 2026 — Наследие -->
    <section class="px-4 py-16 md:py-24 border-t border-burn-border bg-burn-dark/40">
      <div class="max-w-5xl mx-auto space-y-8">
        <p class="text-burn-orange font-medium tracking-wide uppercase text-sm">
          Уральский Бёрн 2026
        </p>
        <div class="w-full lg:w-2/5 rounded-2xl border border-burn-orange/45 bg-burn-orange/10 px-5 py-4">
          <p class="text-burn-cream/90 text-sm uppercase tracking-[0.2em]">Тема 2026 года</p>
          <h2 class="font-display text-3xl sm:text-4xl text-burn-orange mt-1">Наследие</h2>
          <p class="text-burn-cream/75 text-sm mt-2 leading-relaxed">
            Это творческий вектор и приглашение к вдохновению, а не строгий сценарий. Тему можно
            интерпретировать свободно и по-своему.
          </p>
        </div>

        <p class="text-lg text-burn-cream/90 leading-relaxed max-w-4xl">
          Уральские горы хранят древние сказания, ветер доносит голоса предков, а в сердце леса
          мерцают огни костров, у которых веками передавали тайны народов Урала. Всё это — наше
          наследие, и на этом Бёрне мы хотим дать ему звучать снова.
        </p>

        <div class="grid sm:grid-cols-3 gap-4 items-stretch">
          <article class="rounded-xl border border-burn-border bg-burn-card overflow-hidden h-full flex flex-col">
            <div class="relative aspect-[16/10] shrink-0">
              <img
                :src="img('flame.png')"
                alt="Пламя и легенды"
                class="w-full h-full object-cover object-[50%_48%] scale-[1.05]"
                style="
                  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 58%, transparent 100%);
                  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 58%, transparent 100%);
                "
              />
              <div class="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-burn-card via-burn-card/65 to-transparent pointer-events-none"></div>
            </div>
            <div class="px-5 pb-5 pt-3 h-40 flex flex-col">
              <h3 class="font-display text-xl text-burn-cream min-h-[32px]">Живые истории</h3>
              <p class="text-burn-cream/80 text-sm leading-relaxed mt-2 flex-1">
                Лагеря и арты, где легенды Урала оживают через свет, огонь, музыку и костюмы.
              </p>
            </div>
          </article>

          <article class="rounded-xl border border-burn-border bg-burn-card overflow-hidden h-full flex flex-col">
            <div class="relative aspect-[16/10] shrink-0">
              <img
                :src="img('City.png')"
                alt="Город-очаг"
                class="w-full h-full object-cover object-[50%_42%] scale-[1.12]"
                style="
                  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 58%, transparent 100%);
                  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 58%, transparent 100%);
                "
              />
              <div class="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-burn-card via-burn-card/65 to-transparent pointer-events-none"></div>
            </div>
            <div class="px-5 pb-5 pt-3 h-40 flex flex-col">
              <h3 class="font-display text-xl text-burn-cream min-h-[32px]">Город-очаг</h3>
              <p class="text-burn-cream/80 text-sm leading-relaxed mt-2 flex-1">
                На несколько дней создадим пространство, где прошлое встречается с будущим.
              </p>
            </div>
          </article>

          <article class="rounded-xl border border-burn-border bg-burn-card overflow-hidden h-full flex flex-col">
            <div class="relative aspect-[16/10] shrink-0">
              <img
                :src="img('mask.png')"
                alt="Личное наследие"
                class="w-full h-full object-cover object-[50%_38%] scale-[1.08]"
                style="
                  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 58%, transparent 100%);
                  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 58%, transparent 100%);
                "
              />
              <div class="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-burn-card via-burn-card/65 to-transparent pointer-events-none"></div>
            </div>
            <div class="px-5 pb-5 pt-3 h-40 flex flex-col">
              <h3 class="font-display text-xl text-burn-cream min-h-[32px]">Твоё наследие</h3>
              <p class="text-burn-cream/80 text-sm leading-relaxed mt-2 flex-1">
                Наследие живёт в сердцах, руках и пламени костра. Ждём миры, которые вы принесёте.
              </p>
            </div>
          </article>
        </div>
        <!-- <div class="pt-4">
          <RouterLink
            to="/onboarding"
            class="inline-flex items-center justify-center rounded-xl bg-burn-orange px-8 py-3 font-semibold text-burn-black transition hover:bg-burn-orangeLight"
          >
            Присоединиться к Уральскому Бёрну 2026
          </RouterLink>
        </div> -->
      </div>
    </section>

    <!-- Как это было (первый бёрн) -->
    <section class="px-4 py-16 md:py-24 border-t border-burn-border">
      <div class="max-w-5xl mx-auto">
        <h2 class="font-display text-3xl sm:text-4xl text-burn-cream mb-8">Как это было в 2025</h2>
        <p class="text-burn-cream/70 text-sm uppercase tracking-wide mb-4">
          Wild Tribe — первый Уральский бёрн
        </p>
        <p class="text-lg text-burn-cream/90 leading-relaxed max-w-3xl mb-12">
          5 дней, 42 участника, неисчислимое количество нового опыта, эмоций, откровений и прекрасных
          воспоминаний. Танцполы до рассвета, ливни с мокрым снегом, костры до небес, танцы под
          звёздами, смех, свет инсталляций и арт-объектов в тумане. Времени будто не существовало —
          все дни стали одним сплошным прекрасным сном.
        </p>
        <h3 class="font-display text-2xl text-burn-cream mb-4">3 арт-объекта и три сожжения</h3>
        <div class="grid md:grid-cols-3 gap-6 mt-8">
          <div class="rounded-xl border border-burn-border bg-burn-card overflow-hidden">
            <div class="aspect-[4/3]">
              <img
                :src="img('welcome-fire_gates_s.jpg')"
                alt="Пламенные ворота"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="p-6">
              <h4 class="font-display text-xl text-burn-orange mb-2">Пламенные ворота</h4>
              <p class="text-burn-cream/80 text-sm">Встречали на входе</p>
            </div>
          </div>
          <div class="rounded-xl border border-burn-border bg-burn-card overflow-hidden">
            <div class="aspect-[4/3]">
              <img
                :src="img('burning_mistress-of-the-copper-mountain.jpg')"
                alt="Хозяйка медной горы"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="p-6">
              <h4 class="font-display text-xl text-burn-orange mb-2">Хозяйка медной горы</h4>
              <p class="text-burn-cream/80 text-sm">
                Когда пламя взлетало к небу, даже уральские ливни отступали перед его силой!
              </p>
            </div>
          </div>
          <div class="rounded-xl border border-burn-border bg-burn-card overflow-hidden">
            <div class="aspect-[4/3]">
              <img
                :src="img('temple.jpg')"
                alt="Темпл"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="p-6">
              <h4 class="font-display text-xl text-burn-orange mb-2">Темпл</h4>
              <p class="text-burn-cream/80 text-sm">
                Традиционное прощание, с надеждой на продолжение в будущем
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Цитата -->
    <section class="px-4 py-16 md:py-24 border-t border-burn-border bg-burn-dark/50">
      <div class="max-w-3xl mx-auto text-center">
        <blockquote class="font-display text-2xl sm:text-3xl text-burn-cream/95 italic leading-relaxed">
          Бёрн — это не место. Это люди. Это тот огонь, который мы разжигаем в сердцах друг друга.
          Который мы хотим хранить до следующей встречи.
        </blockquote>
        <p class="mt-6 text-burn-orange text-lg">🔥</p>
      </div>
    </section>

    <!-- 7 кэмпов -->
    <section class="px-4 py-16 md:py-24 border-t border-burn-border">
      <div class="max-w-5xl mx-auto">
        <h2 class="font-display text-3xl sm:text-4xl text-burn-cream mb-8">7 кэмпов</h2>
        <ul class="space-y-6">
          <li class="flex gap-4 rounded-xl border border-burn-border bg-burn-card overflow-hidden">
            <div class="w-32 sm:w-40 shrink-0 aspect-[4/3]">
              <img
                :src="img('wildtribe.png')"
                alt="Flame Tribe"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="p-5 flex-1 min-w-0">
              <span class="text-burn-orange font-medium">Flame Tribe</span>
              <span class="block text-burn-cream/85 mt-1">
                Дикий, раскачивающий не только пространство, но и материю, танцпол в дремучей тайге,
                среди мхов, елей и лишайников.
              </span>
            </div>
          </li>
          <li class="flex gap-4 rounded-xl border border-burn-border bg-burn-card overflow-hidden">
            <div class="w-32 sm:w-40 shrink-0 aspect-[4/3]">
              <img
                :src="img('fantastic-love-camp.jpg')"
                alt="Fantastic Love"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="p-5 flex-1 min-w-0">
              <span class="text-burn-orange font-medium">Fantastic Love</span>
              <span class="block text-burn-cream/85 mt-1">Шатер Заботы и бесконечного тепла.</span>
            </div>
          </li>
          <li class="flex gap-4 rounded-xl border border-burn-border bg-burn-card overflow-hidden">
            <div class="w-32 sm:w-40 shrink-0 aspect-[4/3]">
              <img
                :src="img('camp-bar-chud-beloglazaya.jpg')"
                alt="Чудь Белоглазая"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="p-5 flex-1 min-w-0">
              <span class="text-burn-orange font-medium">Чудь Белоглазая</span>
              <span class="block text-burn-cream/85 mt-1">
                Шаманский этнический бар с настойками, горячими перфомансами и практиками.
              </span>
            </div>
          </li>
          <li class="flex gap-4 rounded-xl border border-burn-border bg-burn-card overflow-hidden">
            <div class="w-32 sm:w-40 shrink-0 aspect-[4/3]">
              <img
                :src="img('secret_camp.jpg')"
                alt="Secret Camp"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="p-5 flex-1 min-w-0">
              <span class="text-burn-orange font-medium">Secret Camp</span>
              <span class="block text-burn-cream/85 mt-1">
                Спрятанный в тайге — так же непросто найти гармонию и покой. Для тех, кто нашёл —
                откровения и новые инсайты.
              </span>
            </div>
          </li>
          <li class="flex gap-4 rounded-xl border border-burn-border bg-burn-card overflow-hidden">
            <div class="w-32 sm:w-40 shrink-0 aspect-[4/3]">
              <img
                :src="img('banya.png')"
                alt="Банные церемонии"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="p-5 flex-1 min-w-0">
              <span class="text-burn-orange font-medium">Банные церемонии</span>
              <span class="block text-burn-cream/85 mt-1">
                Теплые, мягкие, согревающие церемонии и горячие чаны под величественными деревьями.
              </span>
            </div>
          </li>
          <li class="flex gap-4 rounded-xl border border-burn-border bg-burn-card overflow-hidden">
            <div class="w-32 sm:w-40 shrink-0 aspect-[4/3]">
              <img
                :src="img('tundra.jpg')"
                alt="Tundra Club"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="p-5 flex-1 min-w-0">
              <span class="text-burn-orange font-medium">Tundra Club</span>
              <span class="block text-burn-cream/85 mt-1">
                Мощный шатер света, дыма и плотного звука с мини-баром.
              </span>
            </div>
          </li>
          <li class="flex gap-4 rounded-xl border border-burn-border bg-burn-card overflow-hidden">
            <div class="w-32 sm:w-40 shrink-0 aspect-[4/3]">
              <img
                :src="img('camp_brothers_chicko.jpg')"
                alt="Братья Цыплята"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="p-5 flex-1 min-w-0">
              <span class="text-burn-orange font-medium">Братья Цыплята</span>
              <span class="block text-burn-cream/85 mt-1">
                НИИ комплексного изучения воздействия температурного режима на табачно-глицериновые
                смеси, парогенерационные процессы и ферментированные травы с H₂O.
              </span>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- Фотографии (галерея из папки src/assets/gallery) -->
    <GallerySection />

    <!-- CTA -->
    <section class="px-4 py-20 md:py-28 border-t border-burn-border">
      <div class="max-w-2xl mx-auto text-center space-y-8">
        <h2 class="font-display text-3xl sm:text-4xl text-burn-cream">Присоединяйся</h2>
        <p class="text-burn-cream/85 text-lg">
          Мы создали удобную систему обучения для всех желающих стать частью события. Здесь ты сможешь узнать о принципах бёрн-сообщества и правилах Уральского Бёрна, а также о способах участия.
          Это своеобразный вайб-чек. Если ты с нами на одной волне, то в конце теста получишь ссылку на чат участников.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <RouterLink
            to="/onboarding"
            class="inline-flex items-center justify-center rounded-xl bg-burn-orange px-8 py-4 font-semibold text-burn-black transition hover:bg-burn-orangeLight"
          >
            Перейти
          </RouterLink>
          <!-- <a
            :href="TG_GROUP"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center rounded-xl border-2 border-burn-border px-8 py-4 font-semibold text-burn-cream transition hover:border-burn-orange/50"
          >
            Группа в Telegram
          </a> -->
        </div>
      </div>
    </section>

    <!-- Мини-футер -->
    <footer class="border-t border-burn-border py-6 px-4 text-center text-sm text-burn-muted">
      Уральский бёрн. Никакой коммерции. Участие и Сообщество.
    </footer>
  </div>
</template>