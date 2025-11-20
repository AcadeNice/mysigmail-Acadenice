<script setup lang="ts">
import { computed, ref } from 'vue'

// CTA that should open the guest data form (your gate modal)
function openGuestGate() {
  window.dispatchEvent(new CustomEvent('open-guest-gate'))
}

// CTA that should open the staff password modal (AuthDialog)
function openStaffAccess() {
  window.dispatchEvent(new CustomEvent('open-auth-dialog'))
}

/* ---------- 3D tilt for the image ---------- */

const tiltX = ref(0)
const tiltY = ref(0)
const tiltWrapper = ref<HTMLElement | null>(null)

const tiltStyle = computed(() => ({
  transform: `perspective(1200px) rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg) scale3d(1.02,1.02,1.02)`,
}))

function onMouseMove(e: MouseEvent) {
  const el = tiltWrapper.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2

  // -1..1 по обеим осям
  const percentX = (x - centerX) / centerX
  const percentY = (y - centerY) / centerY

  const maxTilt = 10 // градусов
  tiltY.value = maxTilt * percentX
  tiltX.value = -maxTilt * percentY
}

function resetTilt() {
  tiltX.value = 0
  tiltY.value = 0
}
</script>

<template>
  <div class="relative overflow-hidden min-h-screen bg-background text-foreground">
    <!-- Header -->
    <header class="fixed inset-x-0 top-0 z-20">
      <a
        href="https://acadenice.fr"
        target="_blank"
        rel="noreferrer"
        class="hidden w-screen items-center justify-center gap-x-2 bg-primary text-xl font-bold leading-relaxed text-primary-foreground lg:flex"
        style="height: 32px"
      >
        <span>N'oubliez pas de visiter le site de l'AcadéNice !</span>
      </a>

      <div
        class="bg-primary py-3 lg:bg-transparent lg:bg-gradient-to-b lg:from-primary lg:to-transparent lg:bg-blend-multiply lg:backdrop-blur-md xl:bg-gradient-to-b xl:from-background xl:to-transparent xl:backdrop-blur-none"
      >
        <div class="container flex max-w-screen-2xl items-center justify-between px-4 lg:px-6">
          <!-- Logo -->
          <a
            aria-label="homepage"
            href="/basic"
            class="flex items-center gap-2"
          >
            <img
              src="/logo_rounded.webp"
              alt="AcadéNice"
              width="48"
              height="48"
              class="hidden xl:block rounded-sm animate-fade-in"
            >
          </a>
          <div />
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="relative isolate bg-background">
      <!-- Decorative grid + gradient blob (background) -->
      <section
        id="hero"
        class="relative"
      >
        <svg
          aria-hidden="true"
          class="absolute inset-0 -z-10 h-full w-full stroke-foreground/10 opacity-60 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)] dark:opacity-40"
        >
          <defs>
            <pattern
              id="acdn-grid"
              width="200"
              height="200"
              x="50%"
              y="-1"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M.5 200V.5H200"
                fill="none"
              />
            </pattern>
          </defs>
          <svg
            x="50%"
            y="-1"
            class="overflow-visible fill-border/20"
          >
            <path
              d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
              stroke-width="0"
            />
          </svg>
          <rect
            width="100%"
            height="100%"
            stroke-width="0"
            fill="url(#acdn-grid)"
          />
        </svg>

        <div
          aria-hidden="true"
          class="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]"
        >
          <!-- keep AcadéNice-ish gradient from teal to warm accent -->
          <div
            class="aspect-[1108/632] h-96 w-[69.25rem] bg-gradient-to-r from-[#4cccb8] to-[#fda100] opacity-40 dark:opacity-20"
            style="
              clip-path: polygon(
                73.6% 51.7%,
                91.7% 11.8%,
                100% 46.4%,
                97.4% 82.2%,
                92.5% 84.9%,
                75.7% 64%,
                55.3% 47.5%,
                46.5% 49.4%,
                45% 62.9%,
                50.3% 87.2%,
                21.3% 64.1%,
                0.1% 100%,
                5.4% 51.1%,
                21.4% 63.9%,
                58.9% 0.2%,
                73.6% 51.7%
              );
            "
          />
        </div>

        <!-- Hero layout: text + illustration -->
        <div class="mx-auto max-w-7xl px-6 lg:flex lg:min-h-screen lg:items-center lg:px-12">
          <!-- Left: copy + CTAs -->
          <div class="mx-auto mt-32 max-w-3xl lg:mx-0 lg:mt-0 lg:max-w-xl lg:pt-8">
            <div class="mt-10 space-y-2">
              <h6 class="text-base font-bold tracking-wide">
                Enfin,
              </h6>
              <h1 class="text-4xl font-bold tracking-tight sm:text-6xl">
                Créez une signature d’e-mail professionnelle en quelques minutes.
              </h1>
            </div>

            <p class="prose prose-base prose-zinc mt-6 text-lg leading-8 dark:prose-invert">
              Pensé pour les équipes d’AcadéNice, cet outil vous permet de générer une signature
              cohérente, accessible et prête à être intégrée dans Gmail.
            </p>

            <!-- CTA buttons (changed texts + wiring to your modals) -->
            <div class="mt-10 flex flex-wrap items-center gap-4">
              <!-- Utiliser gratuitement -> opens guest form modal -->
              <button
                type="button"
                class="inline-flex scale-100 items-center justify-center rounded-sm text-sm font-medium ring-offset-background transition-[transform,background-color] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/80 h-10 px-6 cursor-pointer"
                @click="openGuestGate"
              >
                Utiliser gratuitement
              </button>

              <!-- Accès réservé -> opens AuthDialog (password) -->
              <button
                type="button"
                class="inline-flex scale-100 items-center justify-center rounded-sm text-sm font-medium ring-offset-background transition-[transform,background-color] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-6 cursor-pointer"
                @click="openStaffAccess"
              >
                Accès réservé
              </button>
            </div>
          </div>

          <!-- Right: screenshot / illustration (original size + 3D tilt) -->
          <div class="flex justify-end flex-1">
            <div
              ref="tiltWrapper"
              class="tilt-card mx-auto mt-16 sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 xl:ml-20"
              :style="tiltStyle"
              @mousemove="onMouseMove"
              @mouseleave="resetTilt"
            >
              <img
                src="/assets/example.png"
                alt="Aperçu de l’outil de signature"
                class="tilt-card-inner rounded-xl bg-background/5 shadow-2xl ring-1 ring-foreground/10 max-w-full"
              >
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.tilt-card {
  transform-style: preserve-3d;
  transition:
    transform 160ms ease-out,
    box-shadow 160ms ease-out;
  will-change: transform;
}

.tilt-card-inner {
  display: block;
  transform: translateZ(40px);
  will-change: transform;
}
</style>
