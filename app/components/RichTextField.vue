<template>
  <div class="rounded-lg bg-muted transition-shadow duration-150 focus-within:ring-2 focus-within:ring-ring/50">
    <div
      class="flex items-center gap-0.5 border-b border-border/60 px-1.5 py-1"
      role="toolbar"
      aria-label="Text formatting"
    >
      <button
        v-for="tool in TOOLS"
        :key="tool.command"
        type="button"
        class="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-background hover:text-foreground aria-pressed:bg-background aria-pressed:text-primary"
        :aria-pressed="active.includes(tool.command)"
        :aria-label="tool.label"
        :title="`${tool.label}${tool.hint ? ` (${tool.hint})` : ''}`"
        @mousedown.prevent
        @click="run(tool.command)"
      >
        <component :is="tool.icon" class="size-4" aria-hidden="true" />
      </button>
    </div>

    <div class="relative">
      <div
        :id="id"
        ref="editor"
        contenteditable="true"
        role="textbox"
        aria-multiline="true"
        :aria-labelledby="labelledby"
        class="min-h-[72px] px-3 py-2 text-sm leading-relaxed outline-none [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-0 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5"
        @input="emitValue"
        @blur="emitValue"
        @paste="onPaste"
        @keyup="syncActive"
        @mouseup="syncActive"
        @focus="syncActive"
      />
      <p
        v-if="isBlankHtml(model)"
        class="pointer-events-none absolute inset-x-3 top-2 truncate text-sm text-muted-foreground"
        aria-hidden="true"
      >
        {{ placeholder }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bold, Italic, List, ListOrdered } from '@lucide/vue'
import { isBlankHtml, sanitizeHtml } from '~/utils/richtext'

defineProps<{ id?: string; labelledby?: string; placeholder?: string }>()
const model = defineModel<string>({ required: true })

const TOOLS = [
  { command: 'bold', label: 'Bold', hint: '⌘B', icon: Bold },
  { command: 'italic', label: 'Italic', hint: '⌘I', icon: Italic },
  { command: 'insertUnorderedList', label: 'Bullet list', hint: '', icon: List },
  { command: 'insertOrderedList', label: 'Numbered list', hint: '', icon: ListOrdered },
] as const

const editor = ref<HTMLElement | null>(null)
const active = ref<string[]>([])

// ponytail: execCommand is deprecated but is still the only zero-dependency way
// to do this; swap in an editor library only if we outgrow these four buttons.
function run(command: string) {
  editor.value?.focus()
  document.execCommand(command)
  emitValue()
  syncActive()
}

function syncActive() {
  active.value = TOOLS.filter((t) => {
    try { return document.queryCommandState(t.command) } catch { return false }
  }).map(t => t.command)
}

function emitValue() {
  const html = sanitizeHtml(editor.value?.innerHTML ?? '')
  model.value = isBlankHtml(html) ? '' : html
}

/** Paste as plain text: nothing foreign — markup, styles, trackers — gets in. */
function onPaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') ?? ''
  document.execCommand('insertText', false, text)
}

/**
 * Write into the DOM only when the value really came from outside — comparing against the
 * sanitised DOM, so typing never rewrites the node and resets the caret. Mount matters as
 * much as the watch: the panel fills the form before this field exists.
 */
function render() {
  const el = editor.value
  if (!el) return
  const next = model.value || ''
  if (sanitizeHtml(el.innerHTML) !== next) el.innerHTML = next
}

onMounted(render)
watch(model, render, { flush: 'post' })
</script>
