import React, { useState } from 'react';

// Rounds a max value up to a readable axis top (1-2-5 progression).
const niceMax = (value) => {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
};

/**
 * Single-series daily bar chart. One hue by design — identity comes from the
 * title, so there is no legend and no per-bar color.
 */
const AdminTrendChart = ({ data, format = (v) => v }) => {
  const [hovered, setHovered] = useState(null);

  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const peakIndex = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  const allZero = data.every((d) => d.value === 0);

  return (
    <div className="relative">
      {/* Plot */}
      <div className="relative h-48">
        {/* Gridlines — recessive, behind the marks. Positioned from the top and
            pulled up half their height so each line sits exactly on its value. */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <div
            key={t}
            className="absolute inset-x-0 flex items-center -translate-y-1/2"
            style={{ top: `${(1 - t) * 100}%` }}
          >
            <span className="w-10 shrink-0 text-[10px] font-medium text-gray-400 tabular-nums text-right pr-2">
              {format(Math.round(max * t))}
            </span>
            <div className="flex-1 border-t border-gray-100" />
          </div>
        ))}

        {/* Bars */}
        <div className="absolute inset-0 pl-10 flex items-end gap-1.5">
          {data.map((d, i) => {
            const heightPct = max > 0 ? (d.value / max) * 100 : 0;
            const isHovered = hovered === i;
            return (
              <div
                key={d.label + i}
                className="relative flex-1 h-full flex items-end justify-center"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Direct label on the peak only, never on every bar */}
                {i === peakIndex && !allZero && !isHovered && (
                  <span
                    className="absolute text-[10px] font-bold text-gray-500 tabular-nums"
                    style={{ bottom: `calc(${heightPct}% + 4px)` }}
                  >
                    {format(d.value)}
                  </span>
                )}

                {/* Hover tooltip */}
                {isHovered && (
                  <div
                    className="absolute z-10 px-2 py-1.5 rounded-lg bg-gray-900 text-white shadow-lg pointer-events-none whitespace-nowrap"
                    style={{ bottom: `calc(${heightPct}% + 6px)` }}
                  >
                    <p className="text-[10px] font-medium text-gray-300">{d.fullLabel}</p>
                    <p className="text-xs font-bold tabular-nums">{format(d.value)}</p>
                  </div>
                )}

                {/* Full-height hit target, larger than the mark */}
                <div className="absolute inset-0 rounded-md hover:bg-gray-50/70 transition-colors" />

                <div
                  className="relative w-full max-w-[36px] rounded-t bg-brand-600 transition-opacity"
                  style={{
                    height: `${Math.max(heightPct, d.value > 0 ? 2 : 0)}%`,
                    opacity: hovered === null || isHovered ? 1 : 0.55,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X axis */}
      <div className="pl-10 flex gap-1.5 mt-2">
        {data.map((d, i) => (
          <div key={d.label + i} className="flex-1 text-center">
            <span className={`text-[10px] font-semibold ${hovered === i ? 'text-gray-900' : 'text-gray-400'}`}>
              {d.label}
            </span>
          </div>
        ))}
      </div>

      {allZero && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-400 bg-white/80 px-3 py-1 rounded-full">
            No orders in this period
          </span>
        </div>
      )}
    </div>
  );
};

export default AdminTrendChart;
