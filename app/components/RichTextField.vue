<template>
  <div class="rounded-lg bg-muted transition-shadow duration-150 focus-within:ring-2 focus-within:ring-ring/50">
    <div
      class="flex items-center gap-0.5 border-b border-border/60 px-1.5 py-1"
      role="toolbar"
      aria-label="Text formatting"
    >
      <button
        v-for="tool in TOOLS"
        :key="tool.key"
        type="button"
        class="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-background hover:text-foreground aria-pressed:bg-background aria-pressed:text-primary"
        :aria-pressed="active.includes(tool.key)"
        :aria-label="tool.label"
        :title="`${tool.label}${tool.hint ? ` (${tool.hint})` : ''}`"
        @mousedown.prevent
        @click="run(tool.key)"
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
        class="min-h-[72px] px-3 py-2 text-sm leading-relaxed outline-none [&_code]:rounded [&_code]:bg-background [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-0 [&_pre]:my-1 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-background [&_pre]:p-2 [&_pre]:font-mono [&_pre]:text-[12px] [&_pre]:whitespace-pre-wrap [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5"
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
import { Bold, Code, Italic, List, ListOrdered } from '@lucide/vue'
import { isBlankHtml, sanitizeHtml } from '~/utils/richtext'

defineProps<{ id?: string; labelledby?: string; placeholder?: string }>()
const model = defineModel<string>({ required: true })

const TOOLS = [
  { key: 'bold', label: 'Bold', hint: '⌘B', icon: Bold },
  { key: 'italic', label: 'Italic', hint: '⌘I', icon: Italic },
  { key: 'code', label: 'Code', hint: '`code`', icon: Code },
  { key: 'insertUnorderedList', label: 'Bullet list', hint: '- ', icon: List },
  { key: 'insertOrderedList', label: 'Numbered list', hint: '1. ', icon: ListOrdered },
] as const

const editor = ref<HTMLElement | null>(null)
const active = ref<string[]>([])

// ponytail: execCommand is deprecated but is still the only zero-dependency way
// to do this; swap in an editor library only if we outgrow this toolbar.
function run(key: string) {
  // Only focus when we are not already there: focusing collapses an existing selection,
  // which is exactly what the code button needs to wrap.
  if (document.activeElement !== editor.value) editor.value?.focus()
  if (key === 'code') toggleCode()
  else document.execCommand(key)
  emitValue()
  syncActive()
}

/** The <code> or <pre> the caret sits in, if any. */
function codeAtCaret(): HTMLElement | null {
  const node = getSelection()?.anchorNode
  const el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element | null)
  return (el?.closest('code, pre') as HTMLElement | null) ?? null
}

/**
 * execCommand has no code command, and its insertHTML rewrites a <code> into a styled
 * <span>, so the chip is built by hand. Clicking inside an existing chip unwraps it.
 */
function toggleCode() {
  const existing = codeAtCaret()
  if (existing) {
    existing.replaceWith(...existing.childNodes)
    return
  }
  const selection = getSelection()
  const selected = selection?.toString() ?? ''
  if (!selected) return
  selection?.getRangeAt(0).deleteContents()
  insertCodeChip(selected)
}

function syncActive() {
  const on = TOOLS.filter((t) => {
    if (t.key === 'code') return !!codeAtCaret()
    try { return document.queryCommandState(t.key) } catch { return false }
  }).map(t => t.key)
  active.value = on
}

function emitValue() {
  const html = sanitizeHtml(editor.value?.innerHTML ?? '')
  model.value = isBlankHtml(html) ? '' : html
}

/* ---- Markdown shortcuts ----
 * Typed markers become formatting, the way a note app does it: "- " or "* " starts a
 * bullet list, "1. " a numbered one, "``` " a code block, and **text** / *text* / _text_ /
 * `text` close into bold, italic or inline code. Nothing is stored as markdown: the marker
 * is deleted and the real command runs.
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
const FENCE_MARKER = /^\s*```$/

/**
 * Remove the markdown marker left at the head of the fresh list item and put the caret
 * where the text will go. Plain DOM: execCommand('delete') needs a caret that survives
 * the list command, and it does not.
 */
function stripLeadingMarker(block: 'li' | 'pre' = 'li') {
  const selection = getSelection()
  const anchor = selection?.anchorNode as Node | null
  const item = anchor?.parentElement?.closest(block)
    ?? (anchor as Element | null)?.closest?.(block)
  // First text node, not firstChild: the marker can sit inside a leftover inline wrapper.
  const text = item && document.createTreeWalker(item, NodeFilter.SHOW_TEXT).nextNode() as Text | null
  if (!text) return
  const match = /^\s*(```|[-*]|\d+[.)])\s?/.exec(text.data)
  if (!match) return
  text.deleteData(0, match[0].length)
  const range = document.createRange()
  range.setStart(text, 0)
  range.collapse(true)
  selection?.removeAllRanges()
  selection?.addRange(range)
}

/** Space is the trigger for line markers, so it has to be caught before it is typed. */
function onKeydown(event: KeyboardEvent) {
  if (event.key !== ' ' || event.isComposing) return
  const at = textBeforeCaret()
  if (!at) return
  // The marker must be the whole line so far, and must not already be inside what it makes.
  if (at.node.previousSibling) return
  if (codeAtCaret()) return

  if (FENCE_MARKER.test(at.text)) {
    event.preventDefault()
    // formatBlock keeps the caret in the new <pre>; the marker text comes along, so drop it.
    document.execCommand('formatBlock', false, 'pre')
    stripLeadingMarker('pre')
    emitValue()
    syncActive()
    return
  }

  if (!LIST_MARKER.test(at.text)) return
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
  { re: /(?<!`)`([^`\n]+)`$/, command: 'code' },
] as const

/** Runs after the closing marker is typed, so the pair is complete. */
function applyInlineRule(): boolean {
  const at = textBeforeCaret()
  if (!at) return false
  for (const rule of INLINE_RULES) {
    const match = rule.re.exec(at.text)
    if (!match) continue
    deleteBeforeCaret(at.node, at.text.length, match[0].length)
    if (rule.command === 'code') {
      insertCodeChip(match[1]!)
    } else {
      document.execCommand(rule.command)
      document.execCommand('insertText', false, match[1]!)
      document.execCommand(rule.command)
    }
    return true
  }
  return false
}

/**
 * Built by hand rather than with insertHTML: the caret has to end up in a text node that
 * sits *outside* the chip, or everything typed next keeps joining the code.
 */
function insertCodeChip(code: string) {
  const selection = getSelection()
  const range = selection?.getRangeAt(0)
  if (!range) return
  const chip = document.createElement('code')
  chip.textContent = code
  range.insertNode(chip)
  // A zero-width space, not an empty node: browsers will not hold a caret in an empty
  // text node, and sanitizeHtml strips these back out before anything is stored.
  const tail = document.createTextNode('\u200B')
  chip.after(tail)
  const after = document.createRange()
  after.setStart(tail, 1)
  after.collapse(true)
  selection?.removeAllRanges()
  selection?.addRange(after)
}

function onInput(event: Event) {
  const data = (event as InputEvent).data
  if ((data === '*' || data === '_' || data === '`') && applyInlineRule()) syncActive()
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
