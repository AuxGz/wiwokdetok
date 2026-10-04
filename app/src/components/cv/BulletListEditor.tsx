import React, { useState } from 'react';
import { ACTION_VERBS_ID, WEAK_PREFIXES_ID } from './utils';

interface BulletListEditorProps {
  bullets: string[];
  onChange: (bullets: string[]) => void;
  placeholder?: string;
  minItems?: number;
  label?: string;
  helperText?: string;
}

export const BulletListEditor: React.FC<BulletListEditorProps> = ({
  bullets,
  onChange,
  placeholder = 'Tuliskan pencapaian dengan kata kerja aktif...',
  minItems = 1,
  label = 'Poin Deskripsi / Pencapaian',
  helperText = 'Gunakan kata kerja aktif (mis. Membangun, Mengoptimalkan) dan sertakan metrik hasil nyata.',
}) => {
  const [showVerbHints, setShowVerbHints] = useState(false);

  const safeBullets = bullets && bullets.length > 0 ? bullets : [''];

  const handleBulletChange = (index: number, val: string) => {
    const next = [...safeBullets];
    next[index] = val;
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const next = [...safeBullets];
      next.splice(index + 1, 0, '');
      onChange(next);
      setTimeout(() => {
        const nextInput = document.getElementById(`bullet-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }, 30);
    } else if (e.key === 'Backspace' && safeBullets[index] === '' && safeBullets.length > minItems) {
      e.preventDefault();
      const next = safeBullets.filter((_, i) => i !== index);
      onChange(next);
      setTimeout(() => {
        const prevInput = document.getElementById(`bullet-input-${Math.max(0, index - 1)}`);
        if (prevInput) prevInput.focus();
      }, 30);
    }
  };

  const handleAddBullet = () => {
    onChange([...safeBullets, '']);
    setTimeout(() => {
      const nextInput = document.getElementById(`bullet-input-${safeBullets.length}`);
      if (nextInput) nextInput.focus();
    }, 30);
  };

  const handleRemoveBullet = (index: number) => {
    if (safeBullets.length <= minItems) {
      const next = [...safeBullets];
      next[index] = '';
      onChange(next);
      return;
    }
    const next = safeBullets.filter((_, i) => i !== index);
    onChange(next);
  };

  const insertVerb = (verb: string, activeIndex: number = safeBullets.length - 1) => {
    const next = [...safeBullets];
    const current = next[activeIndex] || '';
    if (!current) {
      next[activeIndex] = `${verb} `;
    } else {
      next[activeIndex] = `${verb} ${current}`;
    }
    onChange(next);
    setShowVerbHints(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[#555555]">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowVerbHints(!showVerbHints)}
          className="text-[11px] font-medium text-[#ED1E28] hover:text-[#D0161F] transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {showVerbHints ? 'Tutup Kata Kerja' : 'Ide Kata Kerja Aktif'}
        </button>
      </div>

      {showVerbHints && (
        <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 text-xs space-y-2 animate-in fade-in duration-150">
          <div className="font-semibold text-neutral-800">
            Contoh kata kerja aksi untuk bidang RPL / Teknologi:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ACTION_VERBS_ID.slice(0, 12).map((verb) => (
              <button
                key={verb}
                type="button"
                onClick={() => insertVerb(verb, safeBullets.length - 1)}
                className="px-2 py-0.5 rounded-full bg-white border border-red-200 text-neutral-700 hover:border-red-400 hover:text-[#ED1E28] transition-colors text-[11px] font-medium"
              >
                + {verb}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-neutral-500 italic">
            Hindari frasa pasif seperti: &quot;bertanggung jawab atas...&quot; atau &quot;tugas saya adalah...&quot;.
          </p>
        </div>
      )}

      {/* Bullets List */}
      <div className="space-y-2">
        {safeBullets.map((bullet, idx) => {
          const hasWeak = WEAK_PREFIXES_ID.some((prefix) =>
            bullet.toLowerCase().trim().startsWith(prefix)
          );

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 font-bold text-sm shrink-0 select-none">•</span>
                <input
                  id={`bullet-input-${idx}`}
                  type="text"
                  value={bullet}
                  onChange={(e) => handleBulletChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  placeholder={placeholder}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all placeholder:text-neutral-400"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveBullet(idx)}
                  aria-label="Hapus baris poin"
                  className="p-1.5 text-neutral-400 hover:text-red-500 rounded-md hover:bg-neutral-100 transition-colors shrink-0"
                  title="Hapus baris"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {hasWeak && (
                <div className="text-[11px] text-amber-600 pl-4 font-medium flex items-center gap-1">
                  <span>💡 Tip:</span> Ganti dengan kata kerja aktif langsung seperti &quot;Membangun&quot; atau &quot;Mengelola&quot; agar lebih menonjol di ATS.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleAddBullet}
          className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-[#ED1E28] transition-colors py-1 px-2 rounded-md hover:bg-neutral-100"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Tambah Poin (Enter)
        </button>
        <span className="text-[11px] text-neutral-400 hidden sm:inline">
          {helperText}
        </span>
      </div>
    </div>
  );
};
