<template>
  <Dialog v-model:open="helpOpen">
    <DialogContent class="sm:max-w-[420px]">
      <DialogHeader>
        <DialogTitle>Keyboard shortcuts</DialogTitle>
        <DialogDescription>
          Single keys, live whenever you are not typing in a field. Esc closes anything that is open.
        </DialogDescription>
      </DialogHeader>

      <!-- Capped like the theme list: on a short landscape viewport the list scrolls
           rather than pushing the footer off screen. -->
      <div class="grid max-h-[60vh] gap-4 overflow-y-auto scroll-thin">
        <section v-for="group in groups" :key="group.title">
          <p class="pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {{ group.title }}
          </p>
          <!-- Term → key really is a definition list, so a screen reader reads "New task, n"
               as one pair instead of two loose strings. -->
          <dl class="grid gap-0.5">
            <div v-for="s in group.items" :key="s.key" class="flex min-h-9 items-center gap-3">
              <dt class="flex min-w-0 items-center gap-2.5 text-[13px] text-foreground">
                <component :is="s.icon" class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span class="truncate">{{ s.label }}</span>
              </dt>
              <dd class="ml-auto">
                <kbd class="grid h-6 min-w-6 shrink-0 place-items-center rounded-md border border-b-2 border-input bg-card px-1 font-mono text-[11px] font-semibold leading-none text-foreground">{{ s.key }}</kbd>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="helpOpen = false">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'

const { groups, helpOpen } = useShortcuts()
</script>
