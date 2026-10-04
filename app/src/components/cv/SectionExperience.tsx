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
import { BulletListEditor } from './BulletListEditor';
import { generateId } from './constants';
import { formatPeriod } from './utils';
import type { CvExperience } from './types';

export const SectionExperience: React.FC = () => {
  const { data, dispatch, addToast, focusedEntryId, setFocusedEntryId } = useCv();
  const { experience } = data;
  const [openId, setOpenId] = useState<string | null>(experience[0]?.id || null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = experience.findIndex((i) => i.id === active.id);
      const newIndex = experience.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const next = arrayMove(experience, oldIndex, newIndex);
        dispatch({
          type: 'REORDER_ITEMS',
          payload: { section: 'experience', items: next },
        });
      }
    }
  };

  const handleAdd = () => {
    const newId = generateId();
    const currentYear = new Date().getFullYear();
    const newExp: CvExperience = {
      id: newId,
      role: '',
      organization: '',
      startMonth: '08',
      startYear: String(currentYear),
      endMonth: '',
      endYear: '',
      current: true,
      bullets: [''],
    };
    dispatch({
      type: 'ADD_ITEM',
      payload: { section: 'experience', item: newExp, prepend: true },
    });
    setOpenId(newId);
    setFocusedEntryId(newId);
  };

  const handleUpdate = (id: string, partial: Partial<CvExperience>) => {
    dispatch({
      type: 'UPDATE_ITEM',
      payload: { section: 'experience', id, data: partial },
    });
  };

  const handleDelete = (exp: CvExperience, index: number) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { section: 'experience', id: exp.id },
    });

    addToast({
      message: `Pengalaman "${exp.role || exp.organization || 'item'}" dihapus.`,
      actionLabel: 'Urungkan',
      onAction: () => {
        dispatch({
          type: 'RESTORE_ITEM',
          payload: { section: 'experience', index, item: exp },
        });
      },
      duration: 6000,
    });
  };

  const handleDuplicate = (id: string) => {
    dispatch({
      type: 'DUPLICATE_ITEM',
      payload: { section: 'experience', id },
    });
  };

  const handleMove = (fromIndex: number, toIndex: number) => {
    dispatch({
      type: 'MOVE_ITEM',
      payload: { section: 'experience', fromIndex, toIndex },
    });
  };

  return (
    <div id="sec-experience" className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E7E8EA] shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div>
          <h2 className="font-bold text-lg sm:text-xl text-[#111827] font-sans">
            Pengalaman & Organisasi
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Organisasi sekolah, kepanitiaan, PKL / magang, atau komunitas IT
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
          + Tambah Pengalaman
        </button>
      </div>

      {experience.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-xl">
          <p className="text-xs text-neutral-400">Belum ada pengalaman atau organisasi yang ditambahkan.</p>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-2 text-xs font-semibold text-[#ED1E28] hover:underline"
          >
            + Tambah Pengalaman
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={experience.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {experience.map((exp, idx) => {
                const periodLabel = formatPeriod(
                  exp.startMonth,
                  exp.startYear,
                  exp.endMonth,
                  exp.endYear,
                  exp.current,
                  data.meta.language
                );

                return (
                  <EntryCard
                    key={exp.id}
                    id={exp.id}
                    title={exp.role}
                    subtitle={exp.organization}
                    period={periodLabel}
                    isOpen={openId === exp.id}
                    onToggle={() => setOpenId(openId === exp.id ? null : exp.id)}
                    canMoveUp={idx > 0}
                    canMoveDown={idx < experience.length - 1}
                    onMoveUp={() => handleMove(idx, idx - 1)}
                    onMoveDown={() => handleMove(idx, idx + 1)}
                    onDuplicate={() => handleDuplicate(exp.id)}
                    onDelete={() => handleDelete(exp, idx)}
                    isFocused={focusedEntryId === exp.id}
                  >
                    {/* Peran & Organisasi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#555555] mb-1">
                          Posisi / Peran <span className="text-[#ED1E28]">*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => handleUpdate(exp.id, { role: e.target.value })}
                          placeholder="cth. Ketua Divisi Web & Coding"
                          autoFocus={idx === 0 && !exp.role}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555555] mb-1">
                          Instansi / Perusahaan / Organisasi <span className="text-[#ED1E28]">*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.organization}
                          onChange={(e) => handleUpdate(exp.id, { organization: e.target.value })}
                          placeholder="cth. Komunitas IT TelDev / OSIS"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Periode */}
                    <PeriodPicker
                      startMonth={exp.startMonth}
                      startYear={exp.startYear}
                      endMonth={exp.endMonth}
                      endYear={exp.endYear}
                      current={exp.current}
                      onStartMonthChange={(val) => handleUpdate(exp.id, { startMonth: val })}
                      onStartYearChange={(val) => handleUpdate(exp.id, { startYear: val })}
                      onEndMonthChange={(val) => handleUpdate(exp.id, { endMonth: val })}
                      onEndYearChange={(val) => handleUpdate(exp.id, { endYear: val })}
                      onCurrentChange={(val) => handleUpdate(exp.id, { current: val })}
                      currentCheckboxLabel="Masih aktif pada posisi ini"
                      lang={data.meta.language}
                    />

                    {/* Bullets */}
                    <BulletListEditor
                      bullets={exp.bullets}
                      onChange={(bullets) => handleUpdate(exp.id, { bullets })}
                      placeholder="cth. Memimpin tim 5 siswa mengembangkan website event sekolah..."
                      label="Deskripsi Tanggung Jawab & Pencapaian"
                    />
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
