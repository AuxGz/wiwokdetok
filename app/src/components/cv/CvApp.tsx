import React, { useState } from 'react';
import { CvProvider, useCv } from './CvContext';
import { CvTopBar } from './CvTopBar';
import { SectionNavStepper } from './SectionNavStepper';
import { FormPersonal } from './FormPersonal';
import { SectionEducation } from './SectionEducation';
import { SectionProjects } from './SectionProjects';
import { SectionExperience } from './SectionExperience';
import { SectionSkills } from './SectionSkills';
import { SectionCustom } from './SectionCustom';
import { SectionOrderingPanel } from './SectionOrderingPanel';
import { PreviewContainer } from './PreviewContainer';
import { ToastContainer } from './Toast';

const CvAppContent: React.FC = () => {
  const { toasts, removeToast } = useCv();
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [activeSection, setActiveSection] = useState('sec-personal');

  const handleNavigateSection = (sectionTarget?: string) => {
    if (!sectionTarget) return;
    setActiveSection(sectionTarget);
    if (mobileTab !== 'form') setMobileTab('form');
    setTimeout(() => {
      const el = document.getElementById(sectionTarget);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  return (
    <div className="relative space-y-6 pb-20 md:pb-0">
      {/* Sticky Mobile Bottom Action Bar (<768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-2 px-4 shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))] cv-no-print">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setMobileTab('form')}
            className={`flex-1 min-h-[44px] py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'form'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            <span>✏️</span>
            <span>Formulir CV</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 min-h-[44px] py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'preview'
                ? 'bg-[#ED1E28] text-white shadow-sm'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            <span>📄</span>
            <span>Pratinjau Kertas A4</span>
          </button>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Builder & Controls (5 cols) */}
        <div
          className={`lg:col-span-6 xl:col-span-5 space-y-6 cv-no-print ${
            mobileTab === 'preview' ? 'hidden md:block' : 'block'
          }`}
        >
          {/* Top Bar (Autosave, Undo/Redo, Backup) */}
          <CvTopBar />

          {/* Stepper Navigation */}
          <SectionNavStepper
            activeSection={activeSection}
            onSelectSection={handleNavigateSection}
          />

          {/* Forms */}
          <div className="space-y-6">
            <FormPersonal />
            <SectionEducation />
            <SectionProjects />
            <SectionExperience />
            <SectionSkills />
            <SectionCustom />
            <SectionOrderingPanel />
          </div>
        </div>

        {/* Right Column: Live A4 Preview Canvas (7 cols) */}
        <div
          className={`lg:col-span-6 xl:col-span-7 sticky top-6 self-start ${
            mobileTab === 'form' ? 'hidden md:block' : 'block'
          }`}
        >
          <PreviewContainer onNavigateSection={handleNavigateSection} />
        </div>
      </div>

      {/* Toasts */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export const CvApp: React.FC = () => {
  return (
    <CvProvider>
      <CvAppContent />
    </CvProvider>
  );
};
