// Restaurant names, addresses, menus and reasons come from Google Places / server data
// and must never be parsed as HTML. Use esc() for every interpolated value in an
// innerHTML template, and safeUrl() for every href built from data.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, ch => ESCAPES[ch]);
}

/** Only http(s) links survive; anything else (javascript:, data:) becomes '#'. */
export function safeUrl(value) {
  try {
    const url = new URL(String(value), window.location.origin);
    return url.protocol === 'http:' || url.protocol === 'https:' ? esc(url.href) : '#';
  } catch {
    return '#';
  }
}
