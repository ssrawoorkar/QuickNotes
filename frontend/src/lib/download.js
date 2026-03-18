/**
 * Triggers a file download in the browser.
 * @param {string} name    - Filename (e.g. "notes.md")
 * @param {string} content - File contents
 * @param {string} mime    - MIME type (e.g. "text/markdown")
 */
export function download(name, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
