import React from 'react';
import { useCv } from './CvContext';
import { calculateCvCompleteness } from './utils';

const SECTIONS = [
  { id: 'sec-personal', label: 'Data Diri', icon: '👤' },
  { id: 'sec-education', label: 'Pendidikan', icon: '🎓' },
  { id: 'sec-projects', label: 'Proyek Aplikasi', icon: '💻' },
  { id: 'sec-experience', label: 'Pengalaman', icon: '💼' },
  { id: 'sec-skills', label: 'Keahlian', icon: '⚡' },
  { id: 'sec-custom', label: 'Lainnya', icon: '🏆' },
];

export const SectionNavStepper: React.FC<{
  activeSection: string;
  onSelectSection: (id: string) => void;
}> = ({ activeSection, onSelectSection }) => {
  const { data } = useCv();
  const { score } = calculateCvCompleteness(data);

  return (
    <div className="bg-white rounded-xl p-3 border border-[#E7E8EA] shadow-2xs space-y-2">
      {/* Progress header */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-neutral-700">Kemajuan Pengisian CV</span>
        <span className="font-bold text-[#ED1E28]">{score}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#ED1E28] to-emerald-500 transition-all duration-300 rounded-full"
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Stepper horizontal pill list */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => onSelectSection(sec.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSection === sec.id
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
            }`}
          >
            <span>{sec.icon}</span>
            <span>{sec.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
