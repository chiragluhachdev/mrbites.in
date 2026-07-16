import React, { useRef } from 'react';
import { ImagePlus } from 'lucide-react';

/**
 * File picker with a live preview, shaped to match how the image will actually
 * be used — a wide short box for banners, a square for cards — so a vendor can
 * see the crop before committing to it.
 */
const ImagePicker = ({ value, onPick, aspect = 'square', label = 'Choose image', hint }) => {
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 5_000_000) {
      window.alert('That image is over 5MB — please pick a smaller one.');
      return;
    }
    onPick(file, URL.createObjectURL(file));
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0]);
        }}
        className={`relative w-full overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-brand-400 hover:bg-brand-50/40 transition-colors group ${
          aspect === 'banner' ? 'aspect-[3/1]' : 'aspect-square max-w-[160px]'
        }`}
      >
        {value ? (
          <>
            <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <span className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/40 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-900/70">
                Replace
              </span>
            </span>
          </>
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-gray-400">
            <ImagePlus size={22} />
            <span className="text-xs font-semibold">{label}</span>
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {hint && <p className="text-[11px] text-gray-400 font-medium mt-1.5">{hint}</p>}
    </div>
  );
};

export default ImagePicker;
