const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Replace the `__UPDATED_DATE__` token with the current "Month YYYY". */
export function stampUpdatedDate(html: string, now: Date = new Date()): string {
  const stamp = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  return html.replaceAll('__UPDATED_DATE__', stamp);
}
