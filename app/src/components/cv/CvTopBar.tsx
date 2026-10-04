import React, { useRef } from 'react';
import { useCv } from './CvContext';
import { migrateData } from './reducer';

export const CvTopBar: React.FC = () => {
  const {
    data,
    dispatch,
    undo,
    redo,
    canUndo,
    canRedo,
    saveStatus,
    lastSavedTime,
    isSample,
    setIsSample,
    addToast,
    storageWarning,
  } = useCv();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear sample data
  const handleClearSample = () => {
    dispatch({ type: 'CLEAR_SAMPLE' });
    setIsSample(false);
    addToast({
      message: 'Contoh data telah dikosongkan. Siap diisi datamu!',
      duration: 4000,
    });
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (data.personal.fullName || 'cv-student').toLowerCase().replace(/\s+/g, '-');
    a.href = url;
    a.download = `${safeName}-cv-backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast({ message: 'File cadangan JSON berhasil diunduh.' });
  };

  // Import JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const migrated = migrateData(parsed);
        const prevData = data;
        dispatch({ type: 'IMPORT', payload: migrated });
        setIsSample(false);
        addToast({
          message: 'Data CV berhasil diimpor dari file JSON.',
          actionLabel: 'Urungkan',
          onAction: () => {
            dispatch({ type: 'IMPORT', payload: prevData });
          },
          duration: 7000,
        });
      } catch {
        alert('File JSON tidak valid atau rusak.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Reset Data completely
  const handleReset = () => {
    if (window.confirm('Yakin ingin mereset formulir CV ke keadaan kosong?')) {
      const prevData = data;
      dispatch({ type: 'RESET' });
      setIsSample(false);
      addToast({
        message: 'Formulir CV telah direset.',
        actionLabel: 'Urungkan',
        onAction: () => {
          dispatch({ type: 'IMPORT', payload: prevData });
        },
        duration: 7000,
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Sample Banner if isSample is true */}
      {isSample && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="text-base">💡</span>
            <div className="text-xs">
              <span className="font-bold">Mode Contoh Profil Siswa:</span> Anda sedang melihat data contoh SMK RPL. Klik tombol untuk mengosongkan dan mulai mengisi data Anda.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleClearSample}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors"
            >
              Kosongkan Contoh
            </button>
            <button
              type="button"
              onClick={() => setIsSample(false)}
              className="p-1 text-amber-700 hover:text-amber-900 rounded"
              title="Tutup banner ini"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {storageWarning && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
          ⚠️ {storageWarning}
        </div>
      )}

      {/* Action Bar (Autosave, Undo, Redo, Export/Import, Reset) */}
      <div className="bg-white rounded-xl p-3 sm:px-4 border border-[#E7E8EA] shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Autosave Status */}
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              saveStatus === 'saving'
                ? 'bg-amber-500 animate-ping'
                : saveStatus === 'saved'
                ? 'bg-emerald-500'
                : 'bg-red-500'
            }`}
          />
          <span className="text-neutral-600 font-medium">
            {saveStatus === 'saving'
              ? 'Menyimpan...'
              : saveStatus === 'saved'
              ? `Tersimpan ✓ ${lastSavedTime ? lastSavedTime : ''}`
              : 'Gagal menyimpan'}
          </span>
          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            (Penyimpanan lokal browser)
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 border border-neutral-200">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              aria-label="Batalkan perubahan (Ctrl+Z)"
              className="p-1.5 text-neutral-600 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed rounded"
              title="Undo (Ctrl+Z)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a5 5 0 015 5v2m-15-7l4-4m-4 4l4 4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              aria-label="Ulangi perubahan (Ctrl+Y)"
              className="p-1.5 text-neutral-600 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed rounded"
              title="Redo (Ctrl+Y)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" />
              </svg>
            </button>
          </div>

          {/* Import JSON */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 font-medium text-xs transition-colors"
            title="Muat data dari file JSON cadangan"
          >
            Impor JSON
          </button>

          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExportJson}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 font-medium text-xs transition-colors"
            title="Unduh cadangan data CV berupa file JSON"
          >
            Ekspor JSON
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            title="Reset Formulir CV"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
