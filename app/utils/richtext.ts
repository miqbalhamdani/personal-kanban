/**
 * Task descriptions hold a small subset of HTML written by RichTextField.
 * Two jobs live here: keep the stored markup to an allowlist, and flatten it
 * back to text for previews and search.
 */

const ALLOWED = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'P', 'DIV', 'BR', 'UL', 'OL', 'LI', 'CODE', 'PRE',
])

/**
 * Allowlist walk: an unknown element is unwrapped (its text survives) and every
 * attribute is dropped, so no style, class, href or on* handler can ride along.
 * DOM-based on purpose — a regex sanitiser is the classic way to get this wrong.
 */
export function sanitizeHtml(html: string): string {
  const host = document.createElement('div')
  host.innerHTML = html
  const walk = (node: Element) => {
    for (const child of [...node.children]) {
      walk(child)
      if (ALLOWED.has(child.tagName)) {
        while (child.attributes.length) child.removeAttribute(child.attributes[0]!.name)
      } else {
        child.replaceWith(...child.childNodes)
      }
    }
  }
  walk(host)
  // The editor parks zero-width spaces next to inline code so the caret has somewhere
  // outside the chip to sit; they are a caret aid, never content.
  return host.innerHTML.replace(/\u200B/g, '')
}

/** Flatten to one line of text. Display and search only — never a security boundary. */
export function htmlToText(value: string): string {
  if (!value.includes('<')) return value
  return value
    // Both ends of a block tag: without the opening one, "…italic" and a following
    // list item would run together as "italicfirst".
    .replace(/<\/?(p|div|li|ul|ol|pre)[^>]*>|<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\u200B/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** A contenteditable left with `<br>` or `<p></p>` looks empty but is not an empty string. */
export const isBlankHtml = (value: string) => !htmlToText(value)
