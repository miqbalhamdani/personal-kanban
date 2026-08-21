<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[440px]">
      <DialogHeader>
        <DialogTitle>Settings</DialogTitle>
        <DialogDescription>
          Pick a theme. It applies immediately and is remembered in this browser.
        </DialogDescription>
      </DialogHeader>

      <fieldset class="grid gap-2">
        <legend class="sr-only">Theme</legend>
        <label
          v-for="t in themes"
          :key="t.id"
          class="relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors duration-150 hover:bg-muted/60 has-[:checked]:border-ring has-[:checked]:bg-muted/60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"
        >
          <input
            v-model="theme"
            type="radio"
            name="theme"
            :value="t.id"
            class="absolute inset-0 size-full cursor-pointer appearance-none"
            :aria-label="t.label"
          >
          <!-- Swatch preview: bg + three accents -->
          <span
            class="flex shrink-0 items-center gap-1 rounded-lg border p-1.5"
            :class="t.dark ? 'border-transparent' : ''"
            :style="{ background: t.swatches[0] }"
            aria-hidden="true"
          >
            <span
              v-for="(c, i) in t.swatches.slice(1)"
              :key="i"
              class="size-3.5 rounded-full"
              :style="{ background: c }"
            />
          </span>

          <span class="min-w-0 grow">
            <span class="flex items-center gap-1.5 text-sm font-semibold">
              {{ t.label }}
              <span v-if="t.dark" class="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Dark</span>
            </span>
            <span class="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{{ t.description }}</span>
          </span>

          <Check
            class="size-4 shrink-0 text-primary transition-opacity duration-150"
            :class="theme === t.id ? 'opacity-100' : 'opacity-0'"
            aria-hidden="true"
          />
        </label>
      </fieldset>

      <DialogFooter>
        <Button type="button" variant="outline" @click="open = false">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Check } from '@lucide/vue'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'

const { open } = useSettingsDialog()
const { theme, themes } = useTheme()
</script>
