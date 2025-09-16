/** Returns ISO start timestamp N days ago (inclusive start, 00:00) and now (exclusive end). */
export function windowFromDays(days: number) {
  const now = new Date();
  const end = now.toISOString();
  const startDate = new Date(now.getTime() - Math.max(1, days) * 86400000);
  startDate.setHours(0,0,0,0);
  return { startISO: startDate.toISOString(), endISO: end };
}