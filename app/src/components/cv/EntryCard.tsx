import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EntryCardProps {
  id: string;
  title: string;
  subtitle?: string;
  period?: string;
  isOpen: boolean;
  onToggle: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  isFocused?: boolean;
  children: React.ReactNode;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  id,
  title,
  subtitle,
  period,
  isOpen,
  onToggle,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  onDuplicate,
  onDelete,
  isFocused = false,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`entry-${id}`}
      className={`border rounded-xl bg-white transition-all duration-200 overflow-hidden ${
        isFocused
          ? 'border-[#ED1E28] ring-2 ring-[#ED1E28]/20 shadow-md'
          : isOpen
          ? 'border-neutral-300 shadow-sm'
          : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/50'
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center gap-2 p-3 sm:p-3.5 select-none bg-neutral-50/70 border-b border-neutral-100">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Geser urutan item"
          className="cursor-grab active:cursor-grabbing p-1 text-neutral-400 hover:text-neutral-600 rounded touch-none"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8h16M4 16h16" />
          </svg>
        </button>

        {/* Title area (click toggles open/close) */}
        <div
          onClick={onToggle}
          className="flex-1 min-w-0 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-1"
        >
          <div className="min-w-0 pr-2">
            <div className="font-semibold text-sm text-neutral-900 truncate">
              {title || <span className="text-neutral-400 italic">Tanpa judul</span>}
            </div>
            {subtitle && (
              <div className="text-xs text-neutral-500 truncate">{subtitle}</div>
            )}
          </div>
          {period && (
            <div className="text-[11px] font-medium text-neutral-400 shrink-0">
              {period}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {onMoveUp && (
            <button
              type="button"
              disabled={!canMoveUp}
              onClick={onMoveUp}
              aria-label="Pindahkan ke atas"
              className="p-1 rounded text-neutral-400 hover:text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-200/60 transition-colors"
              title="Pindah ke atas"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}

          {onMoveDown && (
            <button
              type="button"
              disabled={!canMoveDown}
              onClick={onMoveDown}
              aria-label="Pindahkan ke bawah"
              className="p-1 rounded text-neutral-400 hover:text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-200/60 transition-colors"
              title="Pindah ke bawah"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={onDuplicate}
            aria-label="Duplikasi item"
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
            title="Duplikasi"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onDelete}
            aria-label="Hapus item"
            className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
            title="Hapus"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onToggle}
            aria-label={isOpen ? 'Tutup rincian' : 'Buka rincian'}
            className="p-1 rounded text-neutral-500 hover:text-neutral-800 transition-colors ml-0.5"
          >
            <svg
              className={`w-4 h-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-4 sm:p-5 space-y-4 bg-white border-t border-neutral-100 animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </div>
  );
};
