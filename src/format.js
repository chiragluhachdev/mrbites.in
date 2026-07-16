// Shared formatting + date-range helpers for the finance screens.

/** ₹1,234.50 — always two decimals, because money. */
export const rupees = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** ₹1,234 — for dense tables and chart axes where decimals are noise. */
export const rupeesShort = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

/** Local calendar day as YYYY-MM-DD. Never toISOString — that shifts by timezone. */
export const dayKey = (date = new Date()) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const shiftDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dayKey(d);
};

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

export const formatDay = (key) =>
  new Date(`${key}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

export const formatDateTime = (iso) =>
  `${new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${formatTime(iso)}`;

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
