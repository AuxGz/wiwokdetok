import React, { useRef, useState, useEffect } from 'react';
import { useCv } from './CvContext';
import { CvPreview } from './CvPreview';
import { calculateCvCompleteness } from './utils';
import { CompletenessAuditModal } from './CompletenessAuditModal';

export const PreviewContainer: React.FC<{
  onNavigateSection: (sectionTarget?: string) => void;
}> = ({ onNavigateSection }) => {
  const { data, focusedEntryId, setFocusedEntryId, addToast } = useCv();
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [pageCount, setPageCount] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const { score } = calculateCvCompleteness(data);

  // Auto-fit zoom on mount or resize
  const handleFitWidth = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 32; // subtract padding
    const a4WidthPx = 794; // approx 210mm in standard 96dpi
    const ratio = Math.min(1.2, Math.max(0.4, containerWidth / a4WidthPx));
    setZoomLevel(Number(ratio.toFixed(2)));
  };

  useEffect(() => {
    handleFitWidth();
    window.addEventListener('resize', handleFitWidth);
    return () => window.removeEventListener('resize', handleFitWidth);
  }, []);

  // Calculate paper height and page breaks
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.getElementById('cv-paper-root');
      if (el) {
        const heightPx = el.scrollHeight;
        const pageHeightPx = 1123; // approx 297mm in 96dpi
        const pages = Math.max(1, Math.ceil(heightPx / pageHeightPx));
        setPageCount(pages);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [data, zoomLevel]);

  // Click on preview entry scrolls form into view and focuses
  const handleEntryClick = (entryId: string) => {
    setFocusedEntryId(entryId);
    const targetEl = document.getElementById(`entry-${entryId}`) || document.getElementById(entryId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Plain Text Copy for ATS
  const handleCopyPlainText = () => {
    const { personal, education, experience, projects, skills, custom } = data;
    let txt = `${personal.fullName.toUpperCase()}\n`;
    if (personal.headline) txt += `${personal.headline}\n`;
    txt += `${personal.phone} | ${personal.email} | ${personal.address}\n`;
    if (personal.links.length > 0) {
      txt += `${personal.links.map((l) => `${l.label}: ${l.url}`).join(' | ')}\n`;
    }
    txt += '\n';

    if (personal.summary) {
      txt += `RINGKASAN PROFIL\n${personal.summary}\n\n`;
    }

    if (education.length > 0) {
      txt += `PENDIDIKAN\n`;
      education.forEach((e) => {
        txt += `${e.school} - ${e.major} (${e.startYear} - ${e.current ? 'Present' : e.endYear})\n`;
        if (e.gpa) txt += `Nilai: ${e.gpa}\n`;
        if (e.description) txt += `${e.description}\n`;
        txt += '\n';
      });
    }

    if (projects.length > 0) {
      txt += `PROYEK APLIKASI\n`;
      projects.forEach((p) => {
        txt += `${p.name} | ${p.techStack.join(', ')}\n`;
        if (p.url) txt += `Tautan: ${p.url}\n`;
        p.bullets.forEach((b) => {
          if (b) txt += `- ${b}\n`;
        });
        txt += '\n';
      });
    }

    if (experience.length > 0) {
      txt += `PENGALAMAN & ORGANISASI\n`;
      experience.forEach((exp) => {
        txt += `${exp.role} - ${exp.organization} (${exp.startYear} - ${exp.current ? 'Present' : exp.endYear})\n`;
        exp.bullets.forEach((b) => {
          if (b) txt += `- ${b}\n`;
        });
        txt += '\n';
      });
    }

    if (skills.length > 0) {
      txt += `KEAHLIAN TEKNIS\n`;
      skills.forEach((s) => {
        txt += `${s.category}: ${s.items.join(', ')}\n`;
      });
      txt += '\n';
    }

    if (custom.length > 0) {
      custom.forEach((c) => {
        txt += `${c.title.toUpperCase()}\n`;
        c.entries.forEach((ce) => {
          txt += `${ce.title} (${ce.year}) - ${ce.subtitle}\n`;
          ce.bullets.forEach((b) => {
            if (b) txt += `- ${b}\n`;
          });
        });
        txt += '\n';
      });
    }

    navigator.clipboard.writeText(txt).then(() => {
      addToast({
        message: 'Teks polos CV berhasil disalin ke clipboard!',
        duration: 4000,
      });
    });
  };

  // Print function
  const handlePrint = () => {
    const originalTitle = document.title;
    const studentName = data.personal.fullName.trim() || 'Siswa';
    document.title = `CV - ${studentName}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-[#E5E7EB]/40 rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
      {/* Top Toolbar */}
      <div className="bg-white p-3 sm:px-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2 z-10 shrink-0 cv-no-print">
        {/* Left: Completeness score & warning */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAuditModal(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-neutral-50 hover:bg-neutral-100 transition-colors"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-[#ED1E28]'
              }`}
            />
            <span className="text-xs font-bold text-neutral-800">
              Skor CV: {score}%
            </span>
            <span className="text-[10px] text-neutral-400">Lihat Saran ↗</span>
          </button>

          {/* Page count pill */}
          <div
            className={`text-xs px-2.5 py-1 rounded-md font-medium ${
              pageCount > 2
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            Halaman {pageCount > 1 ? `1 dari ${pageCount}` : '1 dari 1'} {pageCount > 2 && '⚠️ (Disarankan maks 2 hal)'}
          </div>
        </div>

        {/* Right: Zoom controls & Print */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 border border-neutral-200">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
              className="p-1 text-neutral-600 hover:text-neutral-900 rounded"
              title="Perkecil (-)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="text-[11px] font-mono font-medium px-1.5 text-neutral-700 hover:text-neutral-900 rounded transition-colors select-none"
              title="Reset Zoom ke 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
              className="p-1 text-neutral-600 hover:text-neutral-900 rounded"
              title="Perbesar (+)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleFitWidth}
              className="text-[10px] font-medium px-1.5 py-0.5 ml-0.5 rounded bg-white text-neutral-700 hover:text-neutral-900 shadow-2xs"
            >
              Fit
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyPlainText}
            className="p-2 text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg border border-neutral-200 transition-colors"
            title="Salin Teks Polos untuk ATS Portal"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>

          <button
            type="button"
            id="btn-print-cv"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ED1E28] hover:bg-[#D0161F] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Canvas Paper Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start min-h-[500px]"
      >
        <div
          style={{
            width: `${794 * zoomLevel}px`,
            transition: 'width 0.15s ease-out',
          }}
          className="flex justify-center"
        >
          <CvPreview
            data={data}
            scale={zoomLevel}
            onEntryClick={handleEntryClick}
            hoverHighlight={focusedEntryId}
          />
        </div>
      </div>

      {/* Completeness Modal */}
      <CompletenessAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        onNavigateSection={onNavigateSection}
      />
    </div>
  );
};
