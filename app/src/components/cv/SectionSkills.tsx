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
import { generateId } from './constants';
import type { CvSkillCategory } from './types';

export const SectionSkills: React.FC = () => {
  const { data, dispatch, addToast, focusedEntryId, setFocusedEntryId } = useCv();
  const { skills } = data;
  const [openId, setOpenId] = useState<string | null>(skills[0]?.id || null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = skills.findIndex((i) => i.id === active.id);
      const newIndex = skills.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const next = arrayMove(skills, oldIndex, newIndex);
        dispatch({
          type: 'REORDER_ITEMS',
          payload: { section: 'skills', items: next },
        });
      }
    }
  };

  const handleAdd = (presetCategory: string = 'Kategori Baru', presetItems: string[] = []) => {
    const newId = generateId();
    const newSkill: CvSkillCategory = {
      id: newId,
      category: presetCategory,
      items: presetItems,
    };
    dispatch({
      type: 'ADD_ITEM',
      payload: { section: 'skills', item: newSkill, prepend: false },
    });
    setOpenId(newId);
    setFocusedEntryId(newId);
  };

  const handleUpdate = (id: string, partial: Partial<CvSkillCategory>) => {
    dispatch({
      type: 'UPDATE_ITEM',
      payload: { section: 'skills', id, data: partial },
    });
  };

  const handleDelete = (skill: CvSkillCategory, index: number) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { section: 'skills', id: skill.id },
    });

    addToast({
      message: `Kategori keahlian "${skill.category || 'item'}" dihapus.`,
      actionLabel: 'Urungkan',
      onAction: () => {
        dispatch({
          type: 'RESTORE_ITEM',
          payload: { section: 'skills', index, item: skill },
        });
      },
      duration: 6000,
    });
  };

  const handleDuplicate = (id: string) => {
    dispatch({
      type: 'DUPLICATE_ITEM',
      payload: { section: 'skills', id },
    });
  };

  const handleMove = (fromIndex: number, toIndex: number) => {
    dispatch({
      type: 'MOVE_ITEM',
      payload: { section: 'skills', fromIndex, toIndex },
    });
  };

  return (
    <div id="sec-skills" className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E7E8EA] shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div>
          <h2 className="font-bold text-lg sm:text-xl text-[#111827] font-sans">
            Keahlian Teknis & Tools
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Dikelompokkan rapi per kategori agar ATS dan recruiter mudah memindai
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleAdd()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ED1E28]/10 hover:bg-[#ED1E28]/15 text-[#ED1E28] font-semibold text-xs transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          + Tambah Kategori
        </button>
      </div>

      {/* Preset shortcut buttons */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-neutral-500 font-medium">Tambah cepat:</span>
        <button
          type="button"
          onClick={() => handleAdd('Frontend Development', ['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Tailwind CSS'])}
          className="px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors font-medium"
        >
          + Frontend RPL
        </button>
        <button
          type="button"
          onClick={() => handleAdd('Backend & Database', ['Node.js', 'Express.js', 'PostgreSQL', 'MySQL', 'RESTful API'])}
          className="px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors font-medium"
        >
          + Backend & Database
        </button>
        <button
          type="button"
          onClick={() => handleAdd('Tools & Workflow', ['Git', 'GitHub', 'VS Code', 'Postman', 'Figma'])}
          className="px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors font-medium"
        >
          + Tools & Git
        </button>
      </div>

      {skills.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-xl">
          <p className="text-xs text-neutral-400">Belum ada kategori keahlian.</p>
          <button
            type="button"
            onClick={() => handleAdd()}
            className="mt-2 text-xs font-semibold text-[#ED1E28] hover:underline"
          >
            + Tambah Kategori
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={skills.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {skills.map((skill, idx) => (
                <EntryCard
                  key={skill.id}
                  id={skill.id}
                  title={skill.category}
                  subtitle={skill.items.join(', ') || 'Belum ada keahlian'}
                  isOpen={openId === skill.id}
                  onToggle={() => setOpenId(openId === skill.id ? null : skill.id)}
                  canMoveUp={idx > 0}
                  canMoveDown={idx < skills.length - 1}
                  onMoveUp={() => handleMove(idx, idx - 1)}
                  onMoveDown={() => handleMove(idx, idx + 1)}
                  onDuplicate={() => handleDuplicate(skill.id)}
                  onDelete={() => handleDelete(skill, idx)}
                  isFocused={focusedEntryId === skill.id}
                >
                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1">
                      Nama Kategori Keahlian <span className="text-[#ED1E28]">*</span>
                    </label>
                    <input
                      type="text"
                      value={skill.category}
                      onChange={(e) => handleUpdate(skill.id, { category: e.target.value })}
                      placeholder="cth. Frontend Web / Backend / Tools"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none transition-all"
                    />
                  </div>

                  <TagInput
                    tags={skill.items}
                    onChange={(items) => handleUpdate(skill.id, { items })}
                    label="Daftar Keahlian / Teknologi"
                    placeholder="Ketik keahlian lalu tekan Enter atau koma..."
                    helperText="Contoh: JavaScript, React, Tailwind CSS, REST APIs"
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
