/**
 * Simple markdown renderer supporting:
 * h1/h2/h3, bold, italic, unordered lists, horizontal rules, line breaks.
 * Returns an HTML string.
 */
export function renderMarkdown(md) {
  if (!md || typeof md !== 'string') return ''

  const lines = md.split('\n')
  const out = []
  let inList = false

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push('<hr />')
      continue
    }

    // Headings
    const h3 = line.match(/^###\s+(.+)/)
    if (h3) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<h3>${inlineFormat(h3[1])}</h3>`)
      continue
    }
    const h2 = line.match(/^##\s+(.+)/)
    if (h2) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<h2>${inlineFormat(h2[1])}</h2>`)
      continue
    }
    const h1 = line.match(/^#\s+(.+)/)
    if (h1) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<h1>${inlineFormat(h1[1])}</h1>`)
      continue
    }

    // Unordered list item (-, *, +)
    const li = line.match(/^[-*+]\s+(.+)/)
    if (li) {
      if (!inList) { out.push('<ul>'); inList = true }
      out.push(`<li>${inlineFormat(li[1])}</li>`)
      continue
    }

    // Close list if we hit a non-list line
    if (inList) {
      out.push('</ul>')
      inList = false
    }

    // Blank line → paragraph break
    if (line.trim() === '') {
      out.push('<br />')
      continue
    }

    // Regular paragraph line
    out.push(`<p>${inlineFormat(line)}</p>`)
  }

  if (inList) out.push('</ul>')

  return out.join('\n')
}

// Process inline formatting: bold (**), italic (* or _), and inline code.
function inlineFormat(text) {
  // Escape HTML entities first
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Bold+italic ***
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')

  // Bold **
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Italic * or _
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  text = text.replace(/_([^_]+)_/g, '<em>$1</em>')

  return text
}
