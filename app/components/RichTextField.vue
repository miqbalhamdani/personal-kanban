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
        @keydown="onKeydown"
        @input="onInput"
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

/* ---- Markdown shortcuts ----
 * Typed markers become formatting, the way a note app does it: "- " or "* " starts a
 * bullet list, "1. " a numbered one, and **text** / *text* / _text_ close into bold or
 * italic. Nothing is stored as markdown; the marker is deleted and the real command runs.
 */

/** The text of the current line up to the caret, or null when the caret is not in text. */
function textBeforeCaret(): { node: Text; text: string } | null {
  const selection = getSelection()
  if (!selection?.isCollapsed) return null
  const node = selection.anchorNode
  if (!node || node.nodeType !== Node.TEXT_NODE) return null
  return { node: node as Text, text: (node.textContent ?? '').slice(0, selection.anchorOffset) }
}

/** Select the last `length` characters before the caret and drop them. */
function deleteBeforeCaret(node: Text, caret: number, length: number) {
  const range = document.createRange()
  range.setStart(node, caret - length)
  range.setEnd(node, caret)
  const selection = getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  document.execCommand('delete')
}

const LIST_MARKER = /^\s*([-*]|\d+[.)])$/

/**
 * Remove the markdown marker left at the head of the fresh list item and put the caret
 * where the text will go. Plain DOM: execCommand('delete') needs a caret that survives
 * the list command, and it does not.
 */
function stripLeadingMarker() {
  const selection = getSelection()
  const item = (selection?.anchorNode as Node | null)?.parentElement?.closest('li')
    ?? (selection?.anchorNode as Element | null)?.closest?.('li')
  const node = item?.firstChild
  if (!node || node.nodeType !== Node.TEXT_NODE) return
  const text = node as Text
  const match = /^\s*([-*]|\d+[.)])\s?/.exec(text.data)
  if (!match) return
  text.deleteData(0, match[0].length)
  const range = document.createRange()
  range.setStart(text, 0)
  range.collapse(true)
  selection?.removeAllRanges()
  selection?.addRange(range)
}

/** Space is the trigger for list markers, so it has to be caught before it is typed. */
function onKeydown(event: KeyboardEvent) {
  if (event.key !== ' ' || event.isComposing) return
  const at = textBeforeCaret()
  if (!at) return
  // The marker must be the whole line so far, and we must not already be in a list.
  if (at.node.previousSibling || !LIST_MARKER.test(at.text)) return
  if (at.node.parentElement?.closest('li')) return

  event.preventDefault()
  const bullet = /^[-*]$/.test(at.text.trim())
  // List first, marker second: deleting the marker up front empties the line and the
  // caret loses the node the list command needs. The list command also parks the caret
  // before the marker, so strip it off the front of the new item.
  document.execCommand(bullet ? 'insertUnorderedList' : 'insertOrderedList')
  stripLeadingMarker()
  emitValue()
  syncActive()
}

const INLINE_RULES = [
  { re: /\*\*([^*\s](?:[^*]*[^*\s])?)\*\*$/, command: 'bold' },
  // Lookbehind so the first closing * of a **pair** is not read as italic.
  { re: /(?<![*\w])\*([^*\s](?:[^*]*[^*\s])?)\*$/, command: 'italic' },
  { re: /(?<![_\w])_([^_\s](?:[^_]*[^_\s])?)_$/, command: 'italic' },
] as const

/** Runs after the closing marker is typed, so the pair is complete. */
function applyInlineRule(): boolean {
  const at = textBeforeCaret()
  if (!at) return false
  for (const rule of INLINE_RULES) {
    const match = rule.re.exec(at.text)
    if (!match) continue
    deleteBeforeCaret(at.node, at.text.length, match[0].length)
    document.execCommand(rule.command)
    document.execCommand('insertText', false, match[1]!)
    document.execCommand(rule.command)
    return true
  }
  return false
}

function onInput(event: Event) {
  const data = (event as InputEvent).data
  if ((data === '*' || data === '_') && applyInlineRule()) syncActive()
  emitValue()
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
  const current = sanitizeHtml(el.innerHTML)
  if (current === next) return
  // A fresh empty list reads as blank, and the model stores '' for blank. Rewriting the
  // DOM here would delete the list the user just started.
  if (!next && isBlankHtml(current)) return
  el.innerHTML = next
}

onMounted(render)
watch(model, render, { flush: 'post' })
</script>
