import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCv } from './CvContext';
import { ACCENT_COLORS } from './constants';

const SECTION_LABELS: Record<string, { id: string; en: string }> = {
  education: { id: 'Pendidikan', en: 'Education' },
  projects: { id: 'Proyek Aplikasi', en: 'Projects' },
  experience: { id: 'Pengalaman & Organisasi', en: 'Experience' },
  skills: { id: 'Keahlian Teknis', en: 'Technical Skills' },
  custom: { id: 'Bagian Tambahan (Sertifikasi/Prestasi)', en: 'Additional Sections' },
};

const SortableSectionItem: React.FC<{
  id: string;
  isHidden: boolean;
  onToggleVisibility: () => void;
  lang: 'id' | 'en';
}> = ({ id, isHidden, onToggleVisibility, lang }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  const label = SECTION_LABELS[id] ? SECTION_LABELS[id][lang] : id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-all ${
        isHidden
          ? 'bg-neutral-100 text-neutral-400 border-neutral-200'
          : 'bg-white text-neutral-800 border-neutral-200 shadow-2xs hover:border-neutral-300'
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Geser susunan ${label}`}
          className="cursor-grab active:cursor-grabbing p-1 text-neutral-400 hover:text-neutral-600 rounded touch-none"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8h16M4 16h16" />
          </svg>
        </button>
        <span>{label}</span>
      </div>

      <button
        type="button"
        onClick={onToggleVisibility}
        aria-label={isHidden ? `Tampilkan bagian ${label}` : `Sembunyikan bagian ${label}`}
        className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
        title={isHidden ? 'Tampilkan di CV' : 'Sembunyikan dari CV'}
      >
        {isHidden ? (
          <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export const SectionOrderingPanel: React.FC = () => {
  const { data, dispatch } = useCv();
  const { meta } = data;
  const sectionOrder = meta.sectionOrder || ['education', 'projects', 'experience', 'skills', 'custom'];
  const hiddenSections = meta.hiddenSections || [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sectionOrder.indexOf(String(active.id));
      const newIndex = sectionOrder.indexOf(String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        const next = arrayMove(sectionOrder, oldIndex, newIndex);
        dispatch({ type: 'REORDER_SECTIONS', payload: next });
      }
    }
  };

  const handleToggleVisibility = (sectionId: string) => {
    dispatch({ type: 'TOGGLE_SECTION_VISIBILITY', payload: sectionId });
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E7E8EA] shadow-xs space-y-6">
      <div>
        <h2 className="font-bold text-lg sm:text-xl text-[#111827] font-sans">
          Format & Pengaturan Tampilan CV
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Pilih template standar ATS, warna aksen resmi, jenis font, bahasa, dan susun urutan bagian
        </p>
      </div>

      {/* Grid: Template, Bahasa, Font */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Template ATS */}
        <div>
          <label className="block text-xs font-semibold text-[#555555] mb-1.5">
            Template ATS-Friendly
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'modern', label: 'Modern', desc: 'Garis aksen' },
              { id: 'klasik', label: 'Klasik', desc: 'Serif formal' },
              { id: 'ringkas', label: 'Ringkas', desc: 'Kompak 1 hal' },
            ].map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => dispatch({ type: 'SET_META', payload: { template: tmpl.id as any } })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  meta.template === tmpl.id
                    ? 'border-[#ED1E28] bg-red-50/50 text-[#ED1E28] font-bold ring-2 ring-[#ED1E28]/15'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                }`}
              >
                <div className="text-xs">{tmpl.label}</div>
                <div className="text-[10px] text-neutral-400 font-normal mt-0.5">{tmpl.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Bahasa Header */}
        <div>
          <label className="block text-xs font-semibold text-[#555555] mb-1.5">
            Bahasa Header & Label
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'id', label: '🇮🇩 Indonesia', desc: 'Resmi SMK / Magang' },
              { id: 'en', label: '🇬🇧 English', desc: 'Global / Tech standard' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => dispatch({ type: 'SET_META', payload: { language: lang.id as any } })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  meta.language === lang.id
                    ? 'border-[#ED1E28] bg-red-50/50 text-[#ED1E28] font-bold ring-2 ring-[#ED1E28]/15'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                }`}
              >
                <div className="text-xs">{lang.label}</div>
                <div className="text-[10px] text-neutral-400 font-normal mt-0.5">{lang.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pilihan Font & Warna Aksen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
        {/* Pilihan Font */}
        <div>
          <label className="block text-xs font-semibold text-[#555555] mb-1.5">
            Tipografi Font (Standar ATS)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'sans', label: 'Sans-Serif', family: 'Inter / Arial' },
              { id: 'serif', label: 'Serif', family: 'Merriweather / Georgia' },
              { id: 'mono-ish', label: 'Clean Tech', family: 'Modern Clean' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => dispatch({ type: 'SET_META', payload: { font: f.id as any } })}
                className={`p-2 rounded-xl border text-center transition-all ${
                  meta.font === f.id
                    ? 'border-[#ED1E28] bg-red-50/50 text-[#ED1E28] font-bold ring-2 ring-[#ED1E28]/15'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                }`}
              >
                <div className="text-xs">{f.label}</div>
                <div className="text-[9px] text-neutral-400 font-normal mt-0.5">{f.family}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Warna Aksen */}
        <div>
          <label className="block text-xs font-semibold text-[#555555] mb-1.5">
            Warna Aksen Header & Garis
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.hex}
                type="button"
                onClick={() => dispatch({ type: 'SET_META', payload: { accent: color.hex } })}
                aria-label={`Pilih warna ${color.name}`}
                className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                  meta.accent === color.hex ? 'scale-115 ring-2 ring-offset-2 ring-neutral-400' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              >
                {meta.accent === color.hex && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Susunan Bagian CV */}
      <div className="pt-2 border-t border-neutral-100 space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-[#555555]">
            Susunan Urutan Bagian CV (Tarik & Geser)
          </label>
          <span className="text-[11px] text-neutral-400">
            Klik ikon mata untuk sembunyikan/tampilkan
          </span>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sectionOrder.map((secId) => (
                <SortableSectionItem
                  key={secId}
                  id={secId}
                  isHidden={hiddenSections.includes(secId)}
                  onToggleVisibility={() => handleToggleVisibility(secId)}
                  lang={meta.language}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
