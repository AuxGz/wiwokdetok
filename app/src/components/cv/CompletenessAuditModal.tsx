import React, { useState } from 'react';
import { useCv } from './CvContext';
import { calculateCvCompleteness } from './utils';

export const CompletenessAuditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onNavigateSection: (sectionTarget?: string) => void;
}> = ({ isOpen, onClose, onNavigateSection }) => {
  const { data } = useCv();
  if (!isOpen) return null;

  const { score, suggestions } = calculateCvCompleteness(data);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white ${
                score >= 80 ? 'bg-emerald-600' : score >= 50 ? 'bg-amber-500' : 'bg-[#ED1E28]'
              }`}
            >
              {score}%
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">
                Skor Kelengkapan CV Siswa
              </h3>
              <p className="text-xs text-neutral-500">
                Audit otomatis aturan ATS & standar kejuruan RPL
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1 text-xs">
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-600 leading-relaxed text-[11px]">
            💡 <span className="font-semibold text-neutral-800">Catatan Penting:</span> Penilaian ini adalah saran audit format umum dan kelengkapan konten untuk siswa kejuruan, bukan jaminan 100% lolos sistem ATS perusahaan tertentu.
          </div>

          <div className="space-y-2">
            {suggestions.map((sug) => (
              <div
                key={sug.id}
                onClick={() => {
                  if (sug.sectionTarget) {
                    onNavigateSection(sug.sectionTarget);
                    onClose();
                  }
                }}
                className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                  sug.completed
                    ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                    : sug.category === 'critical'
                    ? 'bg-red-50/50 border-red-200 hover:bg-red-50'
                    : 'bg-amber-50/50 border-amber-200 hover:bg-amber-50'
                }`}
              >
                <div className="pt-0.5 shrink-0">
                  {sug.completed ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  ) : (
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                        sug.category === 'critical' ? 'bg-[#ED1E28]' : 'bg-amber-500'
                      }`}
                    >
                      !
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-semibold ${
                        sug.completed ? 'text-emerald-900 line-through opacity-80' : 'text-neutral-900'
                      }`}
                    >
                      {sug.label}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      +{sug.points} poin
                    </span>
                  </div>
                  <p className="text-neutral-600 mt-0.5 text-[11px] leading-normal">
                    {sug.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            {suggestions.filter((s) => s.completed).length} dari {suggestions.length} saran terpenuhi
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
