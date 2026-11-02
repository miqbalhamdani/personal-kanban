import type { ChecklistItem } from '~/types'

/** One line per item; done items start with "[x]". */
export const checklistToText = (items: ChecklistItem[]) =>
  items.filter(c => c.text.trim()).map(c => (c.done ? '[x] ' : '') + c.text.trim()).join('\n')

/** Reverse of checklistToText. Accepts pasted markdown: removes "- ", "* ", "1. " bullets,
    reads "[ ]" / "[x]" as the done flag, skips blank lines, and caps text at 140 characters like the row input. */
export function parseChecklistText(text: string) {
  return text.split(/\r?\n/).flatMap((line) => {
    const [, mark, body = ''] = line.match(/^\s*(?:(?:[-*+•]|\d+[.)])\s+)?(?:\[([ xX]?)\]\s*)?(.*)$/)!
    const t = body.trim().slice(0, 140)
    return t ? [{ text: t, done: mark?.toLowerCase() === 'x' }] : []
  })
}
