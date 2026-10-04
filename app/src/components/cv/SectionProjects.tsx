import React, { useState } from 'react';
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
} from '@dnd-kit/sortable';
import { useCv } from './CvContext';
import { EntryCard } from './EntryCard';
import { TagInput } from './TagInput';
import { BulletListEditor } from './BulletListEditor';
import { generateId } from './constants';
import { normalizeUrl } from './utils';
import type { CvProject } from './types';

export const SectionProjects: React.FC = () => {
  const { data, dispatch, addToast, focusedEntryId, setFocusedEntryId } = useCv();
  const { projects } = data;
  const [openId, setOpenId] = useState<string | null>(projects[0]?.id || null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((i) => i.id === active.id);
      const newIndex = projects.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const next = arrayMove(projects, oldIndex, newIndex);
        dispatch({
          type: 'REORDER_ITEMS',
          payload: { section: 'projects', items: next },
        });
      }
    }
  };

  const handleAdd = () => {
    const newId = generateId();
    const newProj: CvProject = {
      id: newId,
      name: '',
      techStack: ['React', 'Tailwind CSS'],
      url: '',
      bullets: [''],
    };
    dispatch({
      type: 'ADD_ITEM',
      payload: { section: 'projects', item: newProj, prepend: true },
    });
    setOpenId(newId);
    setFocusedEntryId(newId);
  };

  const handleUpdate = (id: string, partial: Partial<CvProject>) => {
    dispatch({
      type: 'UPDATE_ITEM',
      payload: { section: 'projects', id, data: partial },
    });
  };

  const handleDelete = (proj: CvProject, index: number) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { section: 'projects', id: proj.id },
    });

    addToast({
      message: `Proyek "${proj.name || 'item'}" dihapus.`,
      actionLabel: 'Urungkan',
      onAction: () => {
        dispatch({
          type: 'RESTORE_ITEM',
          payload: { section: 'projects', index, item: proj },
        });
      },
      duration: 6000,
    });
  };

  const handleDuplicate = (id: string) => {
    dispatch({
      type: 'DUPLICATE_ITEM',
      payload: { section: 'projects', id },
    });
  };

  const handleMove = (fromIndex: number, toIndex: number) => {
    dispatch({
      type: 'MOVE_ITEM',
      payload: { section: 'projects', fromIndex, toIndex },
    });
  };

  return (
    <div id="sec-projects" className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E7E8EA] shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div>
          <h2 className="font-bold text-lg sm:text-xl text-[#111827] font-sans">
            Proyek Aplikasi & Portofolio
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Karya aplikasi sekolah, tugas akhir, side project, atau open source
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ED1E28]/10 hover:bg-[#ED1E28]/15 text-[#ED1E28] font-semibold text-xs transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          + Tambah Proyek
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-xl">
          <p className="text-xs text-neutral-400">Belum ada proyek yang ditambahkan.</p>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-2 text-xs font-semibold text-[#ED1E28] hover:underline"
          >
            + Tambah Proyek
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {projects.map((proj, idx) => (
                <EntryCard
                  key={proj.id}
                  id={proj.id}
                  title={proj.name}
                  subtitle={proj.techStack.join(', ')}
                  isOpen={openId === proj.id}
                  onToggle={() => setOpenId(openId === proj.id ? null : proj.id)}
                  canMoveUp={idx > 0}
                  canMoveDown={idx < projects.length - 1}
                  onMoveUp={() => handleMove(idx, idx - 1)}
                  onMoveDown={() => handleMove(idx, idx + 1)}
                  onDuplicate={() => handleDuplicate(proj.id)}
                  onDelete={() => handleDelete(proj, idx)}
                  isFocused={focusedEntryId === proj.id}
                >
                  {/* Nama Proyek */}
                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1">
                      Nama Proyek Aplikasi <span className="text-[#ED1E28]">*</span>
                    </label>
                    <input
                      type="text"
                      value={proj.name}
                      onChange={(e) => handleUpdate(proj.id, { name: e.target.value })}
                      placeholder="cth. SiPresensi - Sistem Presensi Siswa Real-time"
                      autoFocus={idx === 0 && !proj.name}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all"
                    />
                  </div>

                  {/* Tech Stack Chips */}
                  <TagInput
                    tags={proj.techStack}
                    onChange={(techStack) => handleUpdate(proj.id, { techStack })}
                    label="Teknologi yang Digunakan (Tech Stack)"
                    placeholder="cth. React, Node.js, PostgreSQL (tekan Enter)"
                    helperText="Tuliskan framework, bahasa, atau tools yang kamu gunakan pada proyek ini."
                  />

                  {/* URL Demo / Repository */}
                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1">
                      Tautan Demo / Repository GitHub
                    </label>
                    <input
                      type="url"
                      value={proj.url}
                      onChange={(e) => handleUpdate(proj.id, { url: e.target.value })}
                      onBlur={() => handleUpdate(proj.id, { url: normalizeUrl(proj.url) })}
                      placeholder="https://github.com/username/project"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all"
                    />
                  </div>

                  {/* Bullets */}
                  <BulletListEditor
                    bullets={proj.bullets}
                    onChange={(bullets) => handleUpdate(proj.id, { bullets })}
                    placeholder="cth. Membangun modul pemindai barcode yang memangkas waktu antre dari 15 ke 3 menit..."
                    label="Deskripsi Fitur Kunci & Hasil/Metrik"
                    minItems={2}
                  />
                </EntryCard>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
