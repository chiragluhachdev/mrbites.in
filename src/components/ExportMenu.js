import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileType, Sheet, ChevronDown } from 'lucide-react';

/**
 * Export dropdown shared by the finance screens. `items` is a list of
 * { label, icon, onClick } — typically PDF, Word, CSV.
 */
const ExportMenu = ({ disabled, items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Download size={15} />
        Export
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <it.icon size={15} className="text-gray-400" />
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const EXPORT_ICONS = { pdf: FileText, doc: FileType, csv: Sheet };

export default ExportMenu;
