<template>
  <div ref="root" class="lp min-h-dvh bg-[#fdfdfc] text-[color:var(--lp-body)]">
    <div class="overflow-clip">
      <!-- ============================== NAV ============================== -->
      <header class="sticky top-2 z-40 px-3 pt-3 sm:top-4 sm:px-6">
        <nav
          class="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-3 shadow-sm backdrop-blur-md sm:px-4"
          aria-label="Landing page"
        >
          <a href="#top" class="flex min-h-11 items-center gap-2.5 rounded-md" aria-label="Intently — back to top">
            <AppMark class="size-7 shrink-0 text-[color:var(--lp-ink)] [--mark-dot:var(--lp-orange-deep)]" />
            <span class="text-[15px] font-semibold tracking-tight text-[color:var(--lp-ink)]">Intently</span>
          </a>
          <div class="hidden items-center gap-1 md:flex">
            <a v-for="l in navLinks" :key="l.href" :href="l.href" class="nav-link">{{ l.label }}</a>
          </div>
          <NuxtLink to="/work" class="btn-primary h-10 px-4 text-sm">
            Open the app
            <ArrowRight class="size-4" aria-hidden="true" />
          </NuxtLink>
        </nav>
      </header>

      <!-- ============================== HERO ============================== -->
      <section id="top" class="hero relative -mt-[4.75rem] overflow-hidden px-4 pb-0 pt-32 sm:px-6 sm:pt-40">
        <div class="cloud cloud-a" aria-hidden="true" />
        <div class="cloud cloud-b" aria-hidden="true" />
        <div class="cloud cloud-c" aria-hidden="true" />

        <div class="relative mx-auto max-w-4xl text-center">
          <span class="pill rv">
            <span class="size-1.5 rounded-full bg-[color:var(--lp-orange)]" aria-hidden="true" />
            Your personal sprint planner
          </span>
          <h1 class="rv mt-6 text-balance text-[clamp(2.4rem,6.5vw,4.6rem)] font-semibold leading-[1.05] tracking-tight text-[color:var(--lp-ink)]">
            You don't need more hours.<br />
            You need a <em class="serif font-normal">queue</em>.
          </h1>
          <p class="rv mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed sm:text-lg">
            Dump every task in, rank by priority and due date, and each morning your day is already
            decided for you. Sprints, epics, and a daily calendar for your side projects — all in
            your browser. No account. No server. Free.
          </p>
          <div class="rv mt-8 flex flex-col items-center gap-3">
            <NuxtLink to="/work" class="btn-primary h-12 px-7 text-base">
              Open the app
              <ArrowRight class="size-4.5" aria-hidden="true" />
            </NuxtLink>
            <p class="text-sm text-[color:var(--lp-muted)]">No signup. You'll be planning in 10 seconds.</p>
          </div>
        </div>

        <!-- Hero mockup: Home view (4-day board + today calendar) -->
        <div class="rv relative mx-auto -mb-16 mt-14 max-w-5xl sm:-mb-28">
          <div class="rounded-2xl border border-white/70 bg-white/75 p-2 shadow-xl shadow-orange-900/10 backdrop-blur-md sm:p-3">
            <div class="rounded-xl border border-[color:var(--lp-line)] bg-white p-3 sm:p-4">
              <div class="mb-3 flex items-center justify-between">
                <p class="text-sm font-semibold text-[color:var(--lp-ink)]">Today</p>
                <span class="mock-chip">Sprint · Aug 24 – 30</span>
              </div>
              <div class="grid gap-3 lg:grid-cols-[1fr_240px]">
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div v-for="day in mockDays" :key="day.label" class="rounded-lg bg-[#f7f6f3] p-2">
                    <p class="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--lp-muted)]">
                      {{ day.label }}
                    </p>
                    <div class="space-y-2">
                      <div v-for="task in day.tasks" :key="task.t" class="mock-task">
                        <p class="truncate text-xs font-medium text-[color:var(--lp-ink)]">{{ task.t }}</p>
                        <span class="mt-1.5 inline-flex items-center gap-1 text-[10px] text-[color:var(--lp-muted)]">
                          <span class="size-1.5 rounded-full" :style="{ background: task.c }" aria-hidden="true" />
                          {{ task.epic }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="rounded-lg bg-[#f7f6f3] p-2">
                  <p class="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--lp-muted)]">Schedule</p>
                  <div class="space-y-1">
                    <div v-for="slot in mockSlots" :key="slot.h" class="flex items-center gap-2">
                      <span class="w-8 text-right text-[10px] tabular-nums text-[color:var(--lp-muted)]">{{ slot.h }}</span>
                      <div class="h-6 flex-1 rounded-md" :class="slot.block ? '' : 'border border-dashed border-[color:var(--lp-line)]'">
                        <div
                          v-if="slot.block"
                          class="flex h-full items-center truncate rounded-md px-2 text-[10px] font-medium text-white"
                          :style="{ background: slot.block.c }"
                        >
                          {{ slot.block.t }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================== WHY ============================== -->
      <section id="why" class="mx-auto max-w-5xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
        <span class="pill rv">
          <span class="size-1.5 rounded-full bg-[color:var(--lp-purple)]" aria-hidden="true" />
          The problem
        </span>
        <h2 class="rv mt-6 max-w-4xl text-balance text-[clamp(1.7rem,3.6vw,2.7rem)] font-semibold leading-snug tracking-tight">
          <span class="text-[color:var(--lp-ink)]">Too much to do isn't the problem. Deciding what's first is.</span>
          <span class="text-[color:var(--lp-faint)]">
            You sit down to work on your side project, spend 30 minutes figuring out where to start — and by the time you
            pick something, the energy is gone.</span
          >
        </h2>
        <div class="mt-12 grid gap-4 sm:grid-cols-3">
          <div v-for="(b, i) in benefits" :key="b.title" class="rv card p-6" :style="{ transitionDelay: `${i * 80}ms` }">
            <span class="grid size-10 place-items-center rounded-xl" :class="b.tint" aria-hidden="true">
              <component :is="b.icon" class="size-5" />
            </span>
            <h3 class="mt-4 font-semibold text-[color:var(--lp-ink)]">{{ b.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed">{{ b.body }}</p>
          </div>
        </div>
      </section>

      <!-- ============================== WHO ============================== -->
      <section class="px-4 sm:px-6">
        <div class="rv mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-[#fff1e6] via-[#fdf3ee] to-[#ede9fe] px-6 py-14 text-center sm:py-16">
          <h2 class="text-balance text-[clamp(1.6rem,3.4vw,2.5rem)] font-semibold tracking-tight text-[color:var(--lp-ink)]">
            Jira is for your job. <em class="serif font-normal text-[color:var(--lp-orange-deep)]">Intently</em> is for you.
          </h2>
          <p class="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed">
            The sprint workflow works — that's why your company uses it. Intently brings it to the projects that are
            actually yours: the side project, the new business, the course you keep postponing. Without the enterprise
            weight, the admin, or anyone else's board.
          </p>
        </div>
      </section>

      <!-- ============================== HOW IT WORKS ============================== -->
      <section id="how" class="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
        <div class="text-center">
          <span class="pill rv">
            <span class="size-1.5 rounded-full bg-[color:var(--lp-orange)]" aria-hidden="true" />
            How it works
          </span>
          <h2 class="rv mt-6 text-balance text-[clamp(1.8rem,4vw,2.8rem)] font-semibold tracking-tight text-[color:var(--lp-ink)]">
            From pile in your head to plan on the wall
          </h2>
        </div>

        <div class="mt-14 space-y-16 sm:space-y-24">
          <div
            v-for="(s, i) in steps"
            :key="s.title"
            class="rv grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
          >
            <!-- Copy -->
            <div :class="i % 2 === 1 ? 'lg:order-last' : ''">
              <span class="text-sm font-semibold tabular-nums text-[color:var(--lp-orange-deep)]">
                {{ String(i + 1).padStart(2, '0') }}
              </span>
              <h3 class="mt-2 text-balance text-[clamp(1.35rem,2.6vw,1.9rem)] font-semibold leading-snug tracking-tight text-[color:var(--lp-ink)]">
                {{ s.title }}
              </h3>
              <div class="mt-4 h-0.5 w-16 rounded bg-[color:var(--lp-orange)]" aria-hidden="true" />
              <p class="mt-5 max-w-lg text-pretty leading-relaxed">{{ s.body }}</p>
            </div>

            <!-- Screenshot, framed as a floating app window -->
            <figure class="shot">
              <div class="shot-bar" aria-hidden="true">
                <span /><span /><span />
              </div>
              <img
                :src="s.img"
                :alt="s.alt"
                :width="s.w"
                :height="s.h"
                loading="lazy"
                decoding="async"
                class="block w-full rounded-lg"
              >
            </figure>
          </div>
        </div>
      </section>

      <!-- ============================== FEATURES ============================== -->
      <section id="features" class="scroll-mt-24 bg-[#f7f6f3] px-4 py-20 sm:px-6 sm:py-28">
        <div class="mx-auto max-w-5xl">
          <div class="text-center">
            <span class="pill rv bg-white">
              <span class="size-1.5 rounded-full bg-[color:var(--lp-purple)]" aria-hidden="true" />
              Features
            </span>
            <h2 class="rv mt-6 text-balance text-[clamp(1.8rem,4vw,2.8rem)] font-semibold tracking-tight text-[color:var(--lp-ink)]">
              Everything you need. Nothing you don't.
            </h2>
          </div>

          <div class="mt-12 grid gap-4 sm:grid-cols-2">
            <!-- Today, decided -->
            <div class="rv card overflow-hidden">
              <div class="feature-stage bg-gradient-to-br from-[#fff0e2] to-[#fbe3d4]">
                <div class="mock-panel">
                  <div class="space-y-1.5">
                    <div v-for="slot in mockSlots.slice(1, 6)" :key="slot.h" class="flex items-center gap-2">
                      <span class="w-8 text-right text-[10px] tabular-nums text-[color:var(--lp-muted)]">{{ slot.h }}</span>
                      <div class="h-6 flex-1 rounded-md" :class="slot.block ? '' : 'border border-dashed border-[color:var(--lp-line)]'">
                        <div
                          v-if="slot.block"
                          class="flex h-full items-center truncate rounded-md px-2 text-[10px] font-medium text-white"
                          :style="{ background: slot.block.c }"
                        >
                          {{ slot.block.t }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="p-6">
                <h3 class="font-semibold text-[color:var(--lp-ink)]">Today, decided</h3>
                <p class="mt-2 text-sm leading-relaxed">
                  The Home view pairs a 4-day kanban with today's calendar. Drag a task onto the calendar to time-block
                  it — your morning starts with a plan, not a decision.
                </p>
              </div>
            </div>

            <!-- Every task, one queue -->
            <div class="rv card overflow-hidden" style="transition-delay: 80ms">
              <div class="feature-stage bg-gradient-to-br from-[#ede9fe] to-[#e4e2f8]">
                <div class="mock-panel">
                  <div class="space-y-1.5">
                    <div v-for="row in mockQueue" :key="row.t" class="flex items-center justify-between rounded-md bg-[#f7f6f3] px-2.5 py-1.5">
                      <span class="truncate text-xs font-medium text-[color:var(--lp-ink)]">{{ row.t }}</span>
                      <span class="ml-2 flex shrink-0 items-center gap-2">
                        <span class="rounded px-1 py-px text-[9px] font-bold" :style="{ background: row.pBg, color: row.pFg }">{{ row.p }}</span>
                        <span class="text-[10px] text-[color:var(--lp-muted)]">{{ row.due }}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="p-6">
                <h3 class="font-semibold text-[color:var(--lp-ink)]">Every task, one queue</h3>
                <p class="mt-2 text-sm leading-relaxed">
                  The Tasks view holds everything — grouped by sprint in a list, or spread across a status kanban:
                  Backlog → Todo → In Progress → Done. Nothing lives in your head anymore.
                </p>
              </div>
            </div>

            <!-- Sprint reports -->
            <div class="rv card overflow-hidden">
              <div class="feature-stage bg-gradient-to-br from-[#fde8d8] to-[#f6dcc7]">
                <div class="mock-panel">
                  <div class="flex items-end justify-between gap-4">
                    <div class="flex h-20 flex-1 items-end gap-1.5" aria-hidden="true">
                      <div
                        v-for="(h, i) in [45, 70, 30, 90, 60, 100, 20]"
                        :key="i"
                        class="flex-1 rounded-t"
                        :style="{ height: `${h}%`, background: i === 5 ? 'var(--lp-orange)' : '#f3d9c4' }"
                      />
                    </div>
                    <div class="donut shrink-0" aria-hidden="true" />
                  </div>
                </div>
              </div>
              <div class="p-6">
                <h3 class="font-semibold text-[color:var(--lp-ink)]">Sprints for a team of one</h3>
                <p class="mt-2 text-sm leading-relaxed">
                  Plan a week, work it, archive it. Each finished sprint turns into charts: daily productivity as bars,
                  time per project as a donut, and a day-by-day board of what actually happened.
                </p>
              </div>
            </div>

            <!-- Epic gantt -->
            <div class="rv card overflow-hidden" style="transition-delay: 80ms">
              <div class="feature-stage bg-gradient-to-br from-[#e3e6fb] to-[#dcdff5]">
                <div class="mock-panel">
                  <div class="space-y-2.5">
                    <div v-for="epic in mockEpics" :key="epic.t">
                      <p class="mb-1 text-[10px] font-medium text-[color:var(--lp-muted)]">{{ epic.t }}</p>
                      <div class="h-3.5 rounded-full bg-[#f0efeb]">
                        <div class="h-full rounded-full" :style="{ width: epic.w, marginLeft: epic.ml, background: epic.c }" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="p-6">
                <h3 class="font-semibold text-[color:var(--lp-ink)]">Your projects on a timeline</h3>
                <p class="mt-2 text-sm leading-relaxed">
                  The Epic Gantt shows every project side by side — so you can see that the e-commerce store waits until
                  the boarding house app ships.
                </p>
              </div>
            </div>

            <!-- Fast in the hand -->
            <div class="rv card flex flex-col items-start gap-4 p-6 sm:col-span-2 sm:flex-row sm:items-center">
              <div class="flex gap-2" aria-hidden="true">
                <span class="grid size-10 place-items-center rounded-xl bg-[#fff1e6] text-[color:var(--lp-orange-deep)]"><MousePointerClick class="size-5" /></span>
                <span class="grid size-10 place-items-center rounded-xl bg-[#ede9fe] text-[color:var(--lp-purple)]"><Keyboard class="size-5" /></span>
              </div>
              <div>
                <h3 class="font-semibold text-[color:var(--lp-ink)]">Fast in the hand</h3>
                <p class="mt-1 text-sm leading-relaxed">
                  Drag and drop everywhere, right-click a task for actions, Escape to close. It stays out of your way.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================== FAQ ============================== -->
      <section id="faq" class="mx-auto max-w-5xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
        <div class="grid gap-10 lg:grid-cols-[2fr_3fr]">
          <div class="rv">
            <span class="pill">
              <span class="size-1.5 rounded-full bg-[color:var(--lp-orange)]" aria-hidden="true" />
              FAQ
            </span>
            <h2 class="mt-6 text-balance text-[clamp(1.8rem,4vw,2.8rem)] font-semibold tracking-tight text-[color:var(--lp-ink)]">
              Your data stays yours
            </h2>
            <p class="mt-4 max-w-sm text-sm leading-relaxed">
              Intently has no backend, no database, and no login. Everything lives in your browser's localStorage and
              never leaves your machine.
            </p>
            <div class="mt-8 flex items-center gap-2 text-sm font-medium text-[color:var(--lp-ink)]">
              <Lock class="size-4 text-[color:var(--lp-purple)]" aria-hidden="true" />
              Private by design
            </div>
          </div>
          <div class="rv space-y-3">
            <details v-for="(f, i) in faqs" :key="f.q" class="faq group">
              <summary class="flex min-h-14 cursor-pointer list-none items-center gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span class="text-sm tabular-nums text-[color:var(--lp-muted)]">{{ String(i + 1).padStart(2, '0') }}</span>
                <span class="flex-1 font-semibold text-[color:var(--lp-ink)]">{{ f.q }}</span>
                <Plus class="faq-icon size-4 shrink-0 text-[color:var(--lp-muted)]" aria-hidden="true" />
              </summary>
              <p class="px-5 pb-5 pl-[3.25rem] text-sm leading-relaxed">{{ f.a }}</p>
            </details>
          </div>
        </div>
      </section>

      <!-- ============================== FINAL CTA + FOOTER ============================== -->
      <section class="hero relative overflow-hidden px-4 pb-10 pt-20 sm:px-6 sm:pt-24">
        <div class="cloud cloud-a" aria-hidden="true" />
        <div class="cloud cloud-c" aria-hidden="true" />
        <div class="relative mx-auto max-w-3xl text-center">
          <h2 class="rv text-balance text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-tight tracking-tight text-[color:var(--lp-ink)]">
            Your week is waiting to be <em class="serif font-normal">queued</em>.
          </h2>
          <p class="rv mx-auto mt-5 max-w-xl text-pretty leading-relaxed">
            Stop rearranging tasks in your head. Put them in order once, and let every morning start already decided.
          </p>
          <div class="rv mt-8 flex flex-col items-center gap-3">
            <NuxtLink to="/work" class="btn-primary h-12 px-7 text-base">
              Open Intently
              <ArrowRight class="size-4.5" aria-hidden="true" />
            </NuxtLink>
            <p class="text-sm text-[color:var(--lp-muted)]">Free. No signup. Nothing leaves your browser.</p>
          </div>
        </div>

        <footer class="relative mx-auto mt-20 flex max-w-5xl flex-col items-center justify-between gap-4 border-t border-[color:var(--lp-line)] pt-6 sm:flex-row">
          <span class="flex items-center gap-2 text-sm font-semibold text-[color:var(--lp-ink)]">
            <AppMark class="size-6 shrink-0 text-[color:var(--lp-ink)] [--mark-dot:var(--lp-orange-deep)]" />
            Intently
          </span>
          <p class="text-xs text-[color:var(--lp-muted)]">© {{ new Date().getFullYear() }} Intently — plan with intent. Made for a team of one.</p>
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, ChartColumnBig, Crosshair, Keyboard, ListTodo, Lock, MousePointerClick, Plus } from '@lucide/vue'

definePageMeta({ layout: false })

// Also hardcoded in public/robots.txt and public/sitemap.xml, which need
// absolute URLs and can't read this.
const SITE = 'https://intently.web.id'

const TITLE = 'Personal Kanban & Sprint Planner for Solo Devs | Intently'
const DESCRIPTION =
  'Personal kanban for side projects: sprints, epics, and a daily calendar in your browser. No account, no server, free — your data never leaves your machine.'

useHead({
  title: TITLE,
  meta: [
    { name: 'description', content: DESCRIPTION },
    // Overrides the app-wide noindex default set in nuxt.config.
    { name: 'robots', content: 'index, follow' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Intently' },
    { property: 'og:url', content: `${SITE}/` },
    { property: 'og:title', content: TITLE },
    { property: 'og:description', content: DESCRIPTION },
    { property: 'og:image', content: `${SITE}/og.png` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: 'Intently — you don\'t need more hours, you need a queue.' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
  link: [
    // Self-referencing canonical: the static host will also serve this page at
    // /index.html and on www, and those must not compete with /.
    { rel: 'canonical', href: `${SITE}/` },
  ],
})

const navLinks = [
  { href: '#why', label: 'Why' },
  { href: '#how', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#faq', label: 'FAQ' },
]

const orange = '#ff761d'
const purple = '#6941c6'
const teal = '#0f9b8e'

const mockDays = [
  {
    label: 'Today',
    tasks: [
      { t: 'Build PRD', epic: 'Boarding House', c: orange },
      { t: 'Outline post: pricing', epic: 'Blog', c: purple },
      { t: 'Sketch room card UI', epic: 'Boarding House', c: orange },
      { t: 'Compare gateways', epic: 'E-Commerce', c: teal },
    ],
  },
  {
    label: 'Tomorrow',
    tasks: [
      { t: 'Design first screens', epic: 'Boarding House', c: orange },
      { t: 'Draft post', epic: 'Blog', c: purple },
      { t: 'Collect pricing refs', epic: 'Blog', c: purple },
    ],
  },
  {
    label: 'Wed',
    tasks: [
      { t: 'Set up repo & CI', epic: 'E-Commerce', c: teal },
      { t: 'Tenant payment flow', epic: 'Boarding House', c: orange },
    ],
  },
  {
    label: 'Thu',
    tasks: [
      { t: 'Room listing model', epic: 'Boarding House', c: orange },
      { t: 'Publish + share', epic: 'Blog', c: purple },
    ],
  },
]

const mockSlots = [
  { h: '08', block: null },
  { h: '09', block: { t: 'Build PRD', c: orange } },
  { h: '10', block: { t: 'Build PRD', c: orange } },
  { h: '11', block: null },
  { h: '12', block: null },
  { h: '13', block: { t: 'Outline post', c: purple } },
  { h: '14', block: null },
  { h: '15', block: { t: 'Sketch room card UI', c: orange } },
  { h: '16', block: { t: 'Sketch room card UI', c: orange } },
  { h: '17', block: null },
  { h: '18', block: null },
  { h: '19', block: { t: 'Compare gateways', c: teal } },
  { h: '20', block: null },
  { h: '21', block: null },
]

// Imported (not served from public/) so Vite content-hashes each file — re-encoding
// a screenshot changes its URL, which stops browsers serving a cached older version.
import epicsTimeline from '~/assets/shots/epics-timeline.webp'
import taskEditor from '~/assets/shots/task-editor.webp'
import sprintList from '~/assets/shots/sprint-list.webp'
import todayCalendar from '~/assets/shots/today-calendar.webp'
import sprintRetro from '~/assets/shots/sprint-retro.webp'

const steps = [
  {
    title: 'Start with your projects',
    body: "Every project you're actually building becomes an Epic. Each one gets a colour, a priority and a due date, then lands on a timeline as a bar running from its first task to its deadline — so you can see what overlaps and what has to wait.",
    img: epicsTimeline,
    w: 1206,
    h: 798,
    alt: 'The Intently epics timeline: one bar per project across August, each labelled with how many of its tasks are done and its priority.',
  },
  {
    title: 'Break them into tasks',
    body: 'Open an epic and list what it actually takes. Each task carries a priority, a status, a due date, the sprint it belongs to and the epic above it — everything you need to decide later, captured once, now.',
    img: taskEditor,
    w: 1600,
    h: 1226,
    alt: "Intently's task editor open over the four-day board, showing a task's priority, status, description, due date, sprint and epic.",
  },
  {
    title: 'Pick your week',
    body: "Group the tasks you intend to finish into a Sprint. Future, active and archived sprints stack in one list, so the week you've committed to stays separate from the pile you haven't — the backlog waits its turn.",
    img: sprintList,
    w: 1600,
    h: 858,
    alt: 'The Intently task list grouped by sprint, with future, active and archived sprints each collapsed into their own section.',
  },
  {
    title: 'Work today, already decided',
    body: "Each morning the Home view shows only the next four days, beside today's calendar. Drag a task onto an hour to decide not just what you'll do, but when. No negotiating with yourself.",
    img: todayCalendar,
    w: 1600,
    h: 1440,
    alt: "Intently's Today view: a four-day board on the left, today's hour-by-hour calendar on the right, and a task card mid-drag over an empty time slot.",
  },
  {
    title: 'Review and recharge',
    body: 'Archive the sprint and read the receipt: where your hours actually went by project, how each day looked, and every task you closed. Did more than you felt? Enjoy the boost. Less than you hoped? Now you know.',
    img: sprintRetro,
    w: 1600,
    h: 1324,
    alt: 'An archived Intently sprint retrospective: a time-per-project doughnut, a daily productivity bar chart, and day-by-day columns of completed tasks.',
  },
]

const benefits = [
  {
    icon: ListTodo,
    tint: 'bg-[#fff1e6] text-[color:var(--lp-orange-deep)]',
    title: 'One queue, not a cloud of worries',
    body: 'Every task goes in, gets a priority and a due date, and lines up. You stop deciding and start doing.',
  },
  {
    icon: Crosshair,
    tint: 'bg-[#ede9fe] text-[color:var(--lp-purple)]',
    title: 'Only what\'s next',
    body: 'Your home screen shows just the next 4 days and today\'s calendar — not the whole terrifying backlog.',
  },
  {
    icon: ChartColumnBig,
    tint: 'bg-[#fff1e6] text-[color:var(--lp-orange-deep)]',
    title: 'Proof you showed up',
    body: 'Every archived sprint becomes a report: what you finished, where your hours went, day by day. "I got nothing done" rarely survives the data.',
  },
]

const mockQueue = [
  { t: 'Setup project', p: 'P1', pBg: '#fff1e6', pFg: '#c2410c', due: 'Mon' },
  { t: 'Build PRD', p: 'P1', pBg: '#fff1e6', pFg: '#c2410c', due: 'Tue' },
  { t: 'Build design', p: 'P2', pBg: '#ede9fe', pFg: '#5b21b6', due: 'Wed' },
  { t: 'Outline blog post', p: 'P3', pBg: '#f0efeb', pFg: '#504238', due: 'Thu' },
]

const mockEpics = [
  { t: 'Build Boarding House App', w: '55%', ml: '0%', c: orange },
  { t: 'Write Blog Posts', w: '35%', ml: '20%', c: purple },
  { t: 'Launch E-Commerce Store', w: '30%', ml: '45%', c: teal },
]

const faqs = [
  {
    q: 'Where is my data?',
    a: 'In your browser, on your device. Nowhere else. There is no server to send it to.',
  },
  {
    q: 'Do I need an account?',
    a: 'No. There\'s nothing to sign up for — open the app and start planning.',
  },
  {
    q: 'Does it sync between devices?',
    a: 'No — that\'s the tradeoff for total privacy. One browser, one board.',
  },
  {
    q: 'What if I clear my browser data?',
    a: 'The board resets. Don\'t clear it without thinking.',
  },
  {
    q: 'How much does it cost?',
    a: 'Nothing. There\'s no server, so there\'s nothing to pay for.',
  },
]

// Structured data. Built from the same `faqs` array the page renders, so the
// schema can never drift from the visible copy. No aggregateRating — there are
// no real reviews to describe.
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'SoftwareApplication',
            name: 'Intently',
            url: `${SITE}/`,
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web browser',
            description: DESCRIPTION,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          },
          {
            '@type': 'FAQPage',
            mainEntity: faqs.map(f => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          },
        ],
      }),
    },
  ],
})

// Reveal-on-scroll; skipped entirely under prefers-reduced-motion (CSS also
// forces .rv visible there, so no-JS and reduced-motion both stay readable).
const root = ref<HTMLElement | null>(null)
let cleanup: (() => void) | undefined
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  document.documentElement.classList.add('lp-smooth')
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      }
    },
    { threshold: 0.15 },
  )
  // Elements are visible by default; the .anim root class opts into the
  // hidden-then-reveal state, so a browser where IO never fires still shows
  // the full page. Above-fold elements reveal immediately, skipping IO.
  root.value?.classList.add('anim')
  document.querySelectorAll('.rv').forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in')
    else io.observe(el)
  })
  cleanup = () => {
    io.disconnect()
    document.documentElement.classList.remove('lp-smooth')
  }
})
onUnmounted(() => cleanup?.())
</script>

<style scoped>
/* Landing palette is pinned here on purpose: the app's data-theme switcher
   must not restyle the marketing page. */
.lp {
  --lp-ink: #2b2118;
  --lp-body: #504238;
  --lp-muted: #7a6a5c;
  --lp-faint: #b3a596;
  --lp-line: #eae7e0;
  --lp-orange: #ff761d;
  --lp-orange-deep: #c2410c;
  --lp-purple: #6941c6;
}

.serif {
  font-family: 'Instrument Serif', Georgia, 'Times New Roman', serif;
  font-style: italic;
  letter-spacing: 0.01em;
}

.hero {
  background:
    radial-gradient(60% 50% at 15% 100%, #ffd9bd 0%, transparent 70%),
    radial-gradient(50% 45% at 90% 90%, #dcd4f7 0%, transparent 70%),
    linear-gradient(160deg, #eaf2fb 0%, #f6eef4 45%, #fdeadd 100%);
}

.cloud {
  position: absolute;
  border-radius: 9999px;
  background: radial-gradient(closest-side, rgba(255, 255, 255, 0.95), transparent);
  filter: blur(28px);
  pointer-events: none;
}
.cloud-a { top: 20%; left: -8%; height: 12rem; width: 30rem; }
.cloud-b { top: 45%; right: -10%; height: 14rem; width: 36rem; }
.cloud-c { bottom: -4rem; left: 25%; height: 12rem; width: 40rem; }

.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--lp-line);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.75);
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--lp-ink);
}

.nav-link {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  border-radius: 0.5rem;
  padding: 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--lp-body);
  transition: color 0.2s ease, background-color 0.2s ease;
}
.nav-link:hover { color: var(--lp-ink); background: rgba(255, 255, 255, 0.9); }

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 9999px;
  background: var(--lp-orange-deep);
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
  box-shadow: 0 1px 2px rgba(80, 66, 56, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.25);
}
.btn-primary:hover { background: #a83a0c; box-shadow: 0 4px 14px rgba(194, 65, 12, 0.35); }
.btn-primary:active { transform: scale(0.98); }

.nav-link:focus-visible,
.btn-primary:focus-visible,
button:focus-visible,
summary:focus-visible,
a:focus-visible {
  outline: 2px solid var(--lp-purple);
  outline-offset: 2px;
}

.card {
  border: 1px solid var(--lp-line);
  border-radius: 1.25rem;
  background: #fff;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}
.card:hover { box-shadow: 0 10px 30px rgba(80, 66, 56, 0.08); transform: translateY(-2px); }

.feature-stage {
  display: grid;
  place-items: center;
  padding: 1.75rem 1.5rem;
}
.mock-panel {
  width: 100%;
  max-width: 20rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.85);
  padding: 0.875rem;
  box-shadow: 0 8px 24px rgba(80, 66, 56, 0.1);
}

.mock-task {
  border: 1px solid var(--lp-line);
  border-radius: 0.625rem;
  background: #fff;
  padding: 0.5rem;
}
.mock-chip {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--lp-line);
  border-radius: 9999px;
  background: #f7f6f3;
  padding: 0.25rem 0.625rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--lp-muted);
}

.donut {
  height: 4.5rem;
  width: 4.5rem;
  border-radius: 9999px;
  background: conic-gradient(var(--lp-orange) 0 55%, var(--lp-purple) 55% 80%, #0f9b8e 80% 100%);
  -webkit-mask: radial-gradient(circle at center, transparent 55%, #000 56%);
  mask: radial-gradient(circle at center, transparent 55%, #000 56%);
}

/* Neutral window frame — keeps the app's cool UI from clashing with the warm page */
.shot {
  border: 1px solid var(--lp-line);
  border-radius: 1rem;
  background: #fff;
  padding: 0.5rem;
  box-shadow: 0 14px 40px rgba(80, 66, 56, 0.1);
}
.shot-bar {
  display: flex;
  gap: 0.3rem;
  padding: 0.15rem 0.35rem 0.5rem;
}
.shot-bar span {
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 9999px;
  background: #e6e2da;
}

.faq {
  border: 1px solid var(--lp-line);
  border-radius: 1rem;
  background: #fbfaf8;
  transition: background-color 0.2s ease;
}
.faq:hover { background: #f7f6f3; }
.faq-icon { transition: transform 0.25s ease; }
.faq[open] .faq-icon { transform: rotate(45deg); }

/* Reveal on scroll — only when JS confirms it can reveal (.anim root class) */
.lp.anim .rv {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.lp.anim .rv.in { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  .lp.anim .rv { opacity: 1; transform: none; transition: none; }
  .faq-icon, .card, .btn-primary { transition: none; }
}
</style>

<style>
html.lp-smooth { scroll-behavior: smooth; }
</style>
