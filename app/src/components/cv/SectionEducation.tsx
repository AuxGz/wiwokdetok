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
import { PeriodPicker } from './PeriodPicker';
import { generateId } from './constants';
import { formatPeriod } from './utils';
import type { CvEducation } from './types';

export const SectionEducation: React.FC = () => {
  const { data, dispatch, addToast, focusedEntryId, setFocusedEntryId } = useCv();
  const { education } = data;
  const [openId, setOpenId] = useState<string | null>(education[0]?.id || null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = education.findIndex((i) => i.id === active.id);
      const newIndex = education.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const next = arrayMove(education, oldIndex, newIndex);
        dispatch({
          type: 'REORDER_ITEMS',
          payload: { section: 'education', items: next },
        });
      }
    }
  };

  const handleAdd = () => {
    const newId = generateId();
    const currentYear = new Date().getFullYear();
    const newEdu: CvEducation = {
      id: newId,
      school: '',
      major: 'Rekayasa Perangkat Lunak (RPL)',
      startMonth: '07',
      startYear: String(currentYear),
      endMonth: '06',
      endYear: String(currentYear + 3),
      current: true,
      gpa: '',
      description: '',
    };
    dispatch({
      type: 'ADD_ITEM',
      payload: { section: 'education', item: newEdu, prepend: true },
    });
    setOpenId(newId);
    setFocusedEntryId(newId);
  };

  const handleUpdate = (id: string, partial: Partial<CvEducation>) => {
    dispatch({
      type: 'UPDATE_ITEM',
      payload: { section: 'education', id, data: partial },
    });
  };

  const handleDelete = (edu: CvEducation, index: number) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { section: 'education', id: edu.id },
    });

    addToast({
      message: `Pendidikan "${edu.school || 'item'}" dihapus.`,
      actionLabel: 'Urungkan',
      onAction: () => {
        dispatch({
          type: 'RESTORE_ITEM',
          payload: { section: 'education', index, item: edu },
        });
      },
      duration: 6000,
    });
  };

  const handleDuplicate = (id: string) => {
    dispatch({
      type: 'DUPLICATE_ITEM',
      payload: { section: 'education', id },
    });
  };

  const handleMove = (fromIndex: number, toIndex: number) => {
    dispatch({
      type: 'MOVE_ITEM',
      payload: { section: 'education', fromIndex, toIndex },
    });
  };

  return (
    <div id="sec-education" className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E7E8EA] shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div>
          <h2 className="font-bold text-lg sm:text-xl text-[#111827] font-sans">
            Pendidikan
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Riwayat sekolah kejuruan atau pendidikan formal terakhir
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
          + Tambah Sekolah
        </button>
      </div>

      {education.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-xl">
          <p className="text-xs text-neutral-400">Belum ada riwayat pendidikan yang ditambahkan.</p>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-2 text-xs font-semibold text-[#ED1E28] hover:underline"
          >
            + Tambah Pendidikan
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={education.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {education.map((edu, idx) => {
                const periodLabel = formatPeriod(
                  edu.startMonth,
                  edu.startYear,
                  edu.endMonth,
                  edu.endYear,
                  edu.current,
                  data.meta.language
                );

                return (
                  <EntryCard
                    key={edu.id}
                    id={edu.id}
                    title={edu.school}
                    subtitle={edu.major}
                    period={periodLabel}
                    isOpen={openId === edu.id}
                    onToggle={() => setOpenId(openId === edu.id ? null : edu.id)}
                    canMoveUp={idx > 0}
                    canMoveDown={idx < education.length - 1}
                    onMoveUp={() => handleMove(idx, idx - 1)}
                    onMoveDown={() => handleMove(idx, idx + 1)}
                    onDuplicate={() => handleDuplicate(edu.id)}
                    onDelete={() => handleDelete(edu, idx)}
                    isFocused={focusedEntryId === edu.id}
                  >
                    {/* Nama Sekolah */}
                    <div>
                      <label className="block text-xs font-semibold text-[#555555] mb-1">
                        Nama Sekolah / Lembaga <span className="text-[#ED1E28]">*</span>
                      </label>
                      <input
                        type="text"
                        value={edu.school}
                        onChange={(e) => handleUpdate(edu.id, { school: e.target.value })}
                        placeholder="cth. SMK Telkom Purwokerto"
                        autoFocus={idx === 0 && !edu.school}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all"
                      />
                    </div>

                    {/* Jurusan & Nilai Rapor / IPK */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#555555] mb-1">
                          Jurusan / Peminatan
                        </label>
                        <input
                          type="text"
                          value={edu.major}
                          onChange={(e) => handleUpdate(edu.id, { major: e.target.value })}
                          placeholder="cth. Rekayasa Perangkat Lunak (RPL)"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555555] mb-1">
                          Nilai / Rata-rata
                        </label>
                        <input
                          type="text"
                          value={edu.gpa}
                          onChange={(e) => handleUpdate(edu.id, { gpa: e.target.value })}
                          placeholder="cth. 89.4 / 100"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Periode */}
                    <PeriodPicker
                      startMonth={edu.startMonth}
                      startYear={edu.startYear}
                      endMonth={edu.endMonth}
                      endYear={edu.endYear}
                      current={edu.current}
                      onStartMonthChange={(val) => handleUpdate(edu.id, { startMonth: val })}
                      onStartYearChange={(val) => handleUpdate(edu.id, { startYear: val })}
                      onEndMonthChange={(val) => handleUpdate(edu.id, { endMonth: val })}
                      onEndYearChange={(val) => handleUpdate(edu.id, { endYear: val })}
                      onCurrentChange={(val) => handleUpdate(edu.id, { current: val })}
                      currentCheckboxLabel="Masih menempuh studi saat ini"
                      lang={data.meta.language}
                    />

                    {/* Deskripsi ringkas / Catatan prestasi */}
                    <div>
                      <label className="block text-xs font-semibold text-[#555555] mb-1">
                        Catatan Relevan / Mata Pelajaran Kejuruan Unggulan
                      </label>
                      <textarea
                        rows={2}
                        value={edu.description}
                        onChange={(e) => handleUpdate(edu.id, { description: e.target.value })}
                        placeholder="cth. Fokus kejuruan: Pemrograman Web, Basis Data, dan Arsitektur RESTful API..."
                        className="w-full px-3.5 py-2 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all resize-y"
                      />
                    </div>
                  </EntryCard>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
