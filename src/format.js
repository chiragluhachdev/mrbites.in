// Shared formatting + date-range helpers for the finance screens.

/** ₹1,234.50 — always two decimals, because money. */
export const rupees = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** ₹1,234 — for dense tables and chart axes where decimals are noise. */
export const rupeesShort = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

// MR-Bites runs on one campus in India, so the business day is an IST day.
//
// These used to read the *browser's* clock. A vendor whose laptop was on the
// wrong timezone — or an admin checking takings from anywhere else — would see a
// different "Today" than the backend computed, and the numbers would not
// reconcile. Both sides now pin to Asia/Kolkata, so the day means the same thing
// everywhere. India has no DST, so the fixed offset is exact.
export const BUSINESS_TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/** The IST calendar day a moment falls on, as YYYY-MM-DD. */
export const dayKey = (date = new Date()) =>
  new Date(new Date(date).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

const shiftDays = (n) => dayKey(new Date(Date.now() - n * 24 * 60 * 60 * 1000));

/** The presets above the finance screens. Each returns { from, to } day keys. */
export const RANGE_PRESETS = [
  { id: 'today', label: 'Today', get: () => ({ from: dayKey(), to: dayKey() }) },
  { id: 'yesterday', label: 'Yesterday', get: () => ({ from: shiftDays(1), to: shiftDays(1) }) },
  { id: '7d', label: 'Last 7 days', get: () => ({ from: shiftDays(6), to: dayKey() }) },
  { id: '30d', label: 'Last 30 days', get: () => ({ from: shiftDays(29), to: dayKey() }) },
  {
    id: 'month',
    label: 'This month',
    get: () => {
      const d = new Date();
      return { from: dayKey(new Date(d.getFullYear(), d.getMonth(), 1)), to: dayKey() };
    },
  },
];

/**
 * Formats an IST day key (YYYY-MM-DD) for display.
 *
 * The key already *is* the IST date, so it is rendered as UTC deliberately —
 * that prints the digits the key contains instead of shifting them a second
 * time. Chart labels must come through here rather than off a Date built from
 * the browser clock, or a label can name a different day than its own key.
 */
export const formatDayKey = (key, options) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString('en-IN', { ...options, timeZone: 'UTC' });

// Rendered in IST for the same reason the day keys are: an order placed at
// 9pm on campus must read "9pm" to everyone looking at it, not shift with the
// viewer's machine.
export const formatDay = (key) =>
  formatDayKey(key, { day: 'numeric', month: 'short', year: 'numeric' });

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', timeZone: BUSINESS_TIMEZONE,
  });

export const formatDateTime = (iso) =>
  `${new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', timeZone: BUSINESS_TIMEZONE,
  })}, ${formatTime(iso)}`;

/** Downloads rows as a CSV file. `columns` is [{ key, label }]. */
export const downloadCsv = (filename, columns, rows) => {
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    columns.map((c) => escape(c.label)).join(','),
    ...rows.map((r) => columns.map((c) => escape(r[c.key])).join(',')),
  ].join('\n');

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
