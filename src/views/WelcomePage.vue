<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// CTA that should open the guest data form (your gate modal)
function openGuestGate() {
  window.dispatchEvent(new CustomEvent('open-guest-gate'))
}

// CTA that should open the staff password modal (AuthDialog)
function openStaffAccess() {
  window.dispatchEvent(new CustomEvent('open-auth-dialog'))
}

/* ---------- 3D tilt  ---------- */

const tiltWrapper = ref<HTMLElement | null>(null)
const enableTilt = ref(true)

let frameId: number | null = null
let lastEvent: MouseEvent | null = null

function updateTilt() {
  frameId = null
  const el = tiltWrapper.value
  const e = lastEvent
  if (!el || !e) return

  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2

  const percentX = (x - centerX) / centerX
  const percentY = (y - centerY) / centerY

  const maxTilt = 10 // degree
  const tiltY = maxTilt * percentX
  const tiltX = -maxTilt * percentY

  el.style.transform = `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02,1.02,1.02)`
}

function onMouseMove(e: MouseEvent) {
  if (!enableTilt.value) return
  lastEvent = e
  if (frameId == null) {
    frameId = window.requestAnimationFrame(updateTilt)
  }
}

function resetTilt() {
  const el = tiltWrapper.value
  if (!el) return
  lastEvent = null
  el.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)'
}

/* ---------- header on scroll ---------- */

const scrolled = ref(false)
const scrollProgress = ref(0)

function handleScroll() {
  const doc = document.documentElement
  const total = doc.scrollHeight - doc.clientHeight
  scrollProgress.value = total > 0 ? (window.scrollY / total) * 100 : 0
  scrolled.value = window.scrollY > 10
}

onMounted(() => {
  // tilt only for "normal" mouse
  try {
    const mqPointerFine = window.matchMedia?.('(pointer: fine)')
    const mqReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')

    if (mqPointerFine && !mqPointerFine.matches) enableTilt.value = false
    if (mqReduce && mqReduce.matches) enableTilt.value = false
  } catch {
    // ignore
  }

  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  if (frameId != null) {
    cancelAnimationFrame(frameId)
  }
})
</script>

<template>
  <div class="relative overflow-hidden min-h-screen bg-background text-foreground">
    <!-- Header -->
    <header
      class="fixed inset-x-0 top-0 z-20 transition-all"
      :class="[
        scrolled ? 'backdrop-blur-lg bg-background/80 border-b border-border shadow-sm' : '',
      ]"
    >
      <!-- progress bar -->
      <div class="h-0.5 w-full bg-border/40">
        <div
          class="h-full bg-primary transition-[width] duration-150"
          :style="{ width: `${scrollProgress}%` }"
        />
      </div>

      <a
        href="https://acadenice.fr"
        target="_blank"
        rel="noreferrer"
        class="hidden h-8 w-screen items-center justify-center gap-x-2 bg-primary text-xl font-bold leading-relaxed text-primary-foreground lg:flex transition-[height] duration-300 ease-in-out hover:h-10"
      >
        <span>N'oubliez pas de visiter le site de l'AcadéNice !</span>
      </a>

      <div
        class="bg-primary py-3 lg:bg-transparent lg:bg-gradient-to-b lg:from-primary lg:to-transparent lg:bg-blend-multiply lg:backdrop-blur-md xl:bg-gradient-to-b xl:from-background xl:to-transparent xl:backdrop-blur-none transition-[padding] duration-300 ease-in-out hover:py-4"
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

        <div
          class="app-brand-title"
          style="position:absolute;left:50%;top:clamp(5.25rem,8vw,7.25rem);z-index:1;width:min(92vw,1500px);transform:translateX(-50%);color:#f6fff8;pointer-events:none;text-align:center;font-family:'Josefin Sans',ui-sans-serif,system-ui,sans-serif;"
        >
          <div style="display:inline-block;">
            <div style="font-size:clamp(2rem,6.35vw,7.7rem);line-height:.92;letter-spacing:0;white-space:nowrap;text-shadow:0 18px 55px rgba(0,0,0,.42);font-weight:700;color:#4CCCB8;">
              Signatures de Mail
            </div>
            <div style="margin-top:.35rem;text-align:right;color:#4cccb8;font-size:clamp(1.05rem,2.35vw,2.85rem);line-height:1;font-weight:400;letter-spacing:.02em;text-shadow:0 14px 38px rgba(0,0,0,.38);">
              par AcadéNice
            </div>
          </div>
        </div>

        <!-- Hero layout: text + illustration -->
        <div class="mx-auto max-w-7xl px-6 lg:flex lg:min-h-screen lg:items-center lg:px-12">
          <!-- Left: copy + CTAs -->
          <div class="mx-auto mt-32 max-w-3xl lg:mx-0 lg:mt-0 lg:max-w-xl lg:pt-8">
            <div class="mt-10">
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

          <!-- Right: screenshot / illustration (optimized 3D tilt) -->
          <div class="flex justify-end flex-1">
            <div
              ref="tiltWrapper"
              class="tilt-card mx-auto mt-16 sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 xl:ml-20"
              @mousemove="onMouseMove"
              @mouseleave="resetTilt"
            >
              <img
                src="/assets/example.png"
                alt="Aperçu de l’outil de signature"
                decoding="async"
                fetchpriority="high"
                class="tilt-card-inner rounded-xl bg-background/5 shadow-2xl ring-1 ring-foreground/10 max-w-full"
              >
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="container mx-auto max-w-7xl px-6 py-8 lg:px-12">
        <div class="flex justify-end">
          <PreviewFooter />
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.tilt-card {
  transform-style: preserve-3d;
  transform: perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1);
  transition:
    transform 160ms ease-out,
    box-shadow 160ms ease-out;
  will-change: transform;
}

.tilt-card-inner {
  display: block;
  transform: translateZ(40px);
  will-change: transform;
  backface-visibility: hidden;
}
</style>
