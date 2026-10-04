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
import { BulletListEditor } from './BulletListEditor';
import { generateId } from './constants';
import type { CvCustomSection, CvCustomEntry } from './types';

export const SectionCustom: React.FC = () => {
  const { data, dispatch, addToast, focusedEntryId, setFocusedEntryId } = useCv();
  const { custom } = data;
  const [openSectionId, setOpenSectionId] = useState<string | null>(custom[0]?.id || null);
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEndSections = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = custom.findIndex((i) => i.id === active.id);
      const newIndex = custom.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const next = arrayMove(custom, oldIndex, newIndex);
        dispatch({
          type: 'REORDER_ITEMS',
          payload: { section: 'custom', items: next },
        });
      }
    }
  };

  const handleAddSection = (presetTitle: string = 'Bagian Kustom Baru') => {
    const newSecId = generateId();
    const newEntryId = generateId();
    const currentYear = String(new Date().getFullYear());
    const newSection: CvCustomSection = {
      id: newSecId,
      title: presetTitle,
      entries: [
        {
          id: newEntryId,
          title: '',
          subtitle: '',
          year: currentYear,
          bullets: [''],
        },
      ],
    };
    dispatch({
      type: 'ADD_ITEM',
      payload: { section: 'custom', item: newSection, prepend: false },
    });
    setOpenSectionId(newSecId);
    setOpenEntryId(newEntryId);
    setFocusedEntryId(newSecId);
  };

  const handleUpdateSectionTitle = (id: string, title: string) => {
    dispatch({
      type: 'UPDATE_ITEM',
      payload: { section: 'custom', id, data: { title } },
    });
  };

  const handleDeleteSection = (sec: CvCustomSection, index: number) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { section: 'custom', id: sec.id },
    });

    addToast({
      message: `Bagian "${sec.title || 'item'}" dihapus.`,
      actionLabel: 'Urungkan',
      onAction: () => {
        dispatch({
          type: 'RESTORE_CUSTOM_SECTION',
          payload: { index, section: sec },
        });
      },
      duration: 6000,
    });
  };

  const handleAddEntry = (sectionId: string) => {
    const newEntryId = generateId();
    const currentYear = String(new Date().getFullYear());
    const newEntry: CvCustomEntry = {
      id: newEntryId,
      title: '',
      subtitle: '',
      year: currentYear,
      bullets: [''],
    };
    dispatch({
      type: 'ADD_CUSTOM_ENTRY',
      payload: { sectionId, entry: newEntry },
    });
    setOpenEntryId(newEntryId);
  };

  const handleUpdateEntry = (sectionId: string, entryId: string, dataPartial: Partial<CvCustomEntry>) => {
    dispatch({
      type: 'UPDATE_CUSTOM_ENTRY',
      payload: { sectionId, entryId, data: dataPartial },
    });
  };

  const handleDeleteEntry = (sectionId: string, entryId: string) => {
    dispatch({
      type: 'REMOVE_CUSTOM_ENTRY',
      payload: { sectionId, entryId },
    });
  };

  return (
    <div id="sec-custom" className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E7E8EA] shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div>
          <h2 className="font-bold text-lg sm:text-xl text-[#111827] font-sans">
            Bagian Tambahan (Sertifikasi, Prestasi, dsb.)
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Sertifikat BNSP, kejuaraan lomba LKS/Web Design, bahasa asing, atau lisensi
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleAddSection()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ED1E28]/10 hover:bg-[#ED1E28]/15 text-[#ED1E28] font-semibold text-xs transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          + Tambah Bagian
        </button>
      </div>

      {/* Preset shortcut buttons */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-neutral-500 font-medium">Preset cepat:</span>
        <button
          type="button"
          onClick={() => handleAddSection('Sertifikasi & Pelatihan')}
          className="px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors font-medium"
        >
          + Sertifikasi
        </button>
        <button
          type="button"
          onClick={() => handleAddSection('Prestasi & Kejuaraan')}
          className="px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors font-medium"
        >
          + Prestasi / LKS
        </button>
        <button
          type="button"
          onClick={() => handleAddSection('Kemampuan Bahasa')}
          className="px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors font-medium"
        >
          + Bahasa
        </button>
        <button
          type="button"
          onClick={() => handleAddSection('Aktivitas Sukarela')}
          className="px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors font-medium"
        >
          + Volunter
        </button>
      </div>

      {custom.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-xl">
          <p className="text-xs text-neutral-400">Belum ada bagian kustom yang ditambahkan.</p>
          <button
            type="button"
            onClick={() => handleAddSection('Sertifikasi & Pelatihan')}
            className="mt-2 text-xs font-semibold text-[#ED1E28] hover:underline"
          >
            + Tambah Sertifikasi atau Prestasi
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndSections}>
          <SortableContext items={custom.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {custom.map((section, secIdx) => {
                const isSecOpen = openSectionId === section.id;

                return (
                  <div
                    key={section.id}
                    className="border border-neutral-200 rounded-xl p-4 sm:p-5 bg-neutral-50/50 space-y-4"
                  >
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
                          placeholder="Judul Bagian (cth. Sertifikasi & Lisensi)"
                          className="font-bold text-base text-neutral-800 bg-transparent border-b border-dashed border-neutral-300 focus:border-[#ED1E28] focus:outline-none px-1 py-0.5"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAddEntry(section.id)}
                          className="text-xs px-2.5 py-1 rounded bg-white border border-neutral-200 hover:border-neutral-400 font-semibold text-neutral-700 transition-colors"
                        >
                          + Tambah Item
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(section, secIdx)}
                          className="p-1.5 text-neutral-400 hover:text-red-500 rounded hover:bg-neutral-100 transition-colors"
                          title="Hapus Bagian Ini"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenSectionId(isSecOpen ? null : section.id)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded hover:bg-neutral-100 transition-colors"
                        >
                          <svg
                            className={`w-4 h-4 transform transition-transform ${isSecOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {isSecOpen && (
                      <div className="space-y-3 pt-2">
                        {section.entries.length === 0 ? (
                          <div className="text-center py-4 bg-white rounded-lg border border-neutral-200">
                            <p className="text-xs text-neutral-400">Belum ada item dalam bagian ini.</p>
                          </div>
                        ) : (
                          section.entries.map((entry) => (
                            <div
                              key={entry.id}
                              className="p-3.5 sm:p-4 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                                  <div className="sm:col-span-2">
                                    <input
                                      type="text"
                                      value={entry.title}
                                      onChange={(e) =>
                                        handleUpdateEntry(section.id, entry.id, { title: e.target.value })
                                      }
                                      placeholder="Nama Sertifikasi / Penghargaan / Bahasa"
                                      className="w-full px-3 py-1.5 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-sm font-semibold text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="text"
                                      value={entry.year}
                                      onChange={(e) =>
                                        handleUpdateEntry(section.id, entry.id, { year: e.target.value })
                                      }
                                      placeholder="Tahun (cth. 2024)"
                                      className="w-full px-3 py-1.5 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEntry(section.id, entry.id)}
                                  className="p-1.5 text-neutral-400 hover:text-red-500 rounded hover:bg-neutral-100 transition-colors shrink-0"
                                  title="Hapus Item"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>

                              <div>
                                <input
                                  type="text"
                                  value={entry.subtitle}
                                  onChange={(e) =>
                                    handleUpdateEntry(section.id, entry.id, { subtitle: e.target.value })
                                  }
                                  placeholder="Pemberi Sertifikat / Lembaga / Penyelenggara (cth. BNSP & Kominfo)"
                                  className="w-full px-3 py-1.5 rounded-lg bg-[#F5F5F5] border border-neutral-200 text-xs sm:text-sm text-[#111827] focus:bg-white focus:border-[#ED1E28] focus:outline-none"
                                />
                              </div>

                              <BulletListEditor
                                bullets={entry.bullets}
                                onChange={(bullets) =>
                                  handleUpdateEntry(section.id, entry.id, { bullets })
                                }
                                placeholder="cth. Lulus uji kompetensi dengan predikat memuaskan..."
                                label="Keterangan Tambahan / Poin Hasil"
                              />
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
