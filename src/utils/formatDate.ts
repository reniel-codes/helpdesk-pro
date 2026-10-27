const formatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** "Oct 27, 2026, 2:05 PM" in the viewer's local time zone. */
export function formatDateTime(iso: string): string {
  return formatter.format(new Date(iso))
}
