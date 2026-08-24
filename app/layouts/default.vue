<template>
  <div class="min-h-dvh bg-background">
    <!-- Mobile bar. The sidebar is the primary nav on wide screens; below lg it
         becomes a slide-in drawer so the board keeps the full viewport width. -->
    <header class="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-3 lg:hidden">
      <Button variant="ghost" size="icon" aria-label="Open navigation" @click="drawer = true">
        <Menu class="size-5" />
      </Button>
      <AppLogo class="grow" />
    </header>

    <!-- Drawer -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="drawer"
        class="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
        @click="drawer = false"
      />
    </Transition>
    <Transition
      enter-active-class="transition-transform duration-200 ease-out"
      leave-active-class="transition-transform duration-150 ease-in"
      enter-from-class="-translate-x-full"
      leave-to-class="-translate-x-full"
    >
      <AppSidebar
        v-if="drawer"
        class="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
        @navigate="drawer = false"
      />
    </Transition>

    <!-- Desktop sidebar -->
    <AppSidebar class="fixed inset-y-0 left-0 z-30 hidden w-60 lg:flex" />

    <main class="lg:pl-60">
      <slot />
    </main>

    <!-- Deferred until first open so their chunks (reka dialog, date picker) stay off the first paint. -->
    <LazyTaskPanel v-if="panelUsed" />
    <LazySettingsDialog v-if="settingsUsed" />
    <LazyShortcutsDialog v-if="helpUsed" />

    <!-- Lives here, not in app.vue: only this layout raises toasts, and mounting
         it globally pulled vue-sonner into the landing page's critical path. -->
    <Toaster position="bottom-right" :duration="5000" />
  </div>
</template>

<script setup lang="ts">
import { Menu } from '@lucide/vue'
import { Button } from '~/components/ui/button'
import { Toaster } from '~/components/ui/sonner'

const drawer = ref(false)
const route = useRoute()

// Latch on first open (instead of v-if on open) so close animations still play.
const taskDialog = useTaskDialog()
const settingsDialog = useSettingsDialog()
const epicDialog = useEpicDialog()
const sprintDialog = useSprintDialog()
const { onKey: onShortcutKey, helpOpen } = useShortcuts()
const panelUsed = ref(false)
const settingsUsed = ref(false)
const helpUsed = ref(false)
watch(taskDialog.open, v => { if (v) panelUsed.value = true })
watch(settingsDialog.open, v => { if (v) settingsUsed.value = true })
watch(helpOpen, v => { if (v) helpUsed.value = true })

// The epic and sprint editors live on their pages; navigating away must not leave one armed.
watch(() => route.fullPath, () => {
  drawer.value = false
  epicDialog.epicId.value = null
  sprintDialog.sprintId.value = null
})

// Escape closes the drawer, matching the modal behaviour. Same listener runs the shortcuts.
onMounted(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') drawer.value = false
    onShortcutKey(e)
  }
  window.addEventListener('keydown', onKey)
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
})
</script>
