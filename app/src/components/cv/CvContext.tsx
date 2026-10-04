import React, { createContext, useContext, useReducer, useEffect, useRef, useState, useCallback } from 'react';
import type { CvData, CvAction } from './types';
import { SAMPLE_CV_DATA, EMPTY_CV_DATA } from './constants';
import { cvReducer, CURRENT_STORAGE_KEY, BACKUP_STORAGE_KEY, migrateData } from './reducer';

export interface ToastItem {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface CvContextType {
  data: CvData;
  dispatch: (action: CvAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedTime: string | null;
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  isSample: boolean;
  setIsSample: (val: boolean) => void;
  activePreviewTarget: string | null;
  setActivePreviewTarget: (target: string | null) => void;
  focusedEntryId: string | null;
  setFocusedEntryId: (id: string | null) => void;
  storageWarning: string | null;
}

const CvContext = createContext<CvContextType | null>(null);

export const CvProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, baseDispatch] = useReducer(cvReducer, SAMPLE_CV_DATA);
  const [isSample, setIsSample] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [activePreviewTarget, setActivePreviewTarget] = useState<string | null>(null);
  const [focusedEntryId, setFocusedEntryId] = useState<string | null>(null);

  // Undo / Redo history stack (up to 50 entries)
  const historyRef = useRef<CvData[]>([SAMPLE_CV_DATA]);
  const historyIndexRef = useRef<number>(0);
  const lastCoalesceTimeRef = useRef<number>(0);
  const isUndoRedoActionRef = useRef<boolean>(false);

  // Add toast helper
  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Dispatch wrapper with undo snapshot coalescence
  const dispatch = useCallback((action: CvAction) => {
    baseDispatch(action);
  }, []);

  // Update history snapshots when data changes
  useEffect(() => {
    if (isUndoRedoActionRef.current) {
      isUndoRedoActionRef.current = false;
      return;
    }

    const now = Date.now();
    const canCoalesce = now - lastCoalesceTimeRef.current < 800;
    lastCoalesceTimeRef.current = now;

    const currentIndex = historyIndexRef.current;
    const history = historyRef.current.slice(0, currentIndex + 1);

    if (canCoalesce && history.length > 1) {
      // Replace top of history
      history[history.length - 1] = data;
      historyRef.current = history;
    } else {
      // Append snapshot
      const nextHistory = [...history, data].slice(-50);
      historyRef.current = nextHistory;
      historyIndexRef.current = nextHistory.length - 1;
    }
  }, [data]);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const targetSnapshot = historyRef.current[historyIndexRef.current];
      isUndoRedoActionRef.current = true;
      baseDispatch({ type: 'IMPORT', payload: targetSnapshot });
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const targetSnapshot = historyRef.current[historyIndexRef.current];
      isUndoRedoActionRef.current = true;
      baseDispatch({ type: 'IMPORT', payload: targetSnapshot });
    }
  }, []);

  // Keyboard shortcut Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is inside an input/textarea and simple typing, let native input undo happen if needed,
      // but if Ctrl+Z / Ctrl+Shift+Z or Ctrl+Y is pressed outside or modifier handled:
      const isZ = e.key.toLowerCase() === 'z';
      const isY = e.key.toLowerCase() === 'y';
      const isModifier = e.ctrlKey || e.metaKey;

      if (!isModifier) return;

      if (isZ && !e.shiftKey) {
        // Undo
        if (canUndo) {
          e.preventDefault();
          undo();
        }
      } else if ((isZ && e.shiftKey) || isY) {
        // Redo
        if (canRedo) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  // Initial load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CURRENT_STORAGE_KEY) || localStorage.getItem('jhic_student_cv');
      if (stored) {
        const parsed = JSON.parse(stored);
        const migrated = migrateData(parsed);
        baseDispatch({ type: 'IMPORT', payload: migrated });
        setIsSample(false);
        historyRef.current = [migrated];
        historyIndexRef.current = 0;
      }
    } catch (err) {
      console.warn('Gagal membaca data CV dari localStorage, memulihkan ke data bersih:', err);
      try {
        const corrupted = localStorage.getItem(CURRENT_STORAGE_KEY);
        if (corrupted) {
          localStorage.setItem(BACKUP_STORAGE_KEY, corrupted);
        }
      } catch {}
      addToast({
        message: 'Data CV sebelumnya rusak. Cadangan disimpan & formulir dimuat ulang.',
      });
    }
  }, [addToast]);

  // Autosave to localStorage with 500ms debounce
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialMountRef = useRef<boolean>(true);

  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }

    setSaveStatus('saving');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(CURRENT_STORAGE_KEY, JSON.stringify(data));
        setSaveStatus('saved');
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setLastSavedTime(timeStr);
        setStorageWarning(null);
      } catch (err) {
        console.error('LocalStorage save error:', err);
        setSaveStatus('error');
        setStorageWarning('Data tidak bisa disimpan di browser ini. Ekspor JSON untuk cadangan.');
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [data]);

  // Tab synchronization (storage event listener)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CURRENT_STORAGE_KEY && e.newValue) {
        try {
          const remoteData = JSON.parse(e.newValue);
          addToast({
            message: 'CV diubah di tab lain.',
            actionLabel: 'Muat Ulang',
            onAction: () => {
              baseDispatch({ type: 'IMPORT', payload: remoteData });
            },
            duration: 10000,
          });
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [addToast]);

  // beforeunload warning if saving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  return (
    <CvContext.Provider
      value={{
        data,
        dispatch,
        undo,
        redo,
        canUndo,
        canRedo,
        saveStatus,
        lastSavedTime,
        toasts,
        addToast,
        removeToast,
        isSample,
        setIsSample,
        activePreviewTarget,
        setActivePreviewTarget,
        focusedEntryId,
        setFocusedEntryId,
        storageWarning,
      }}
    >
      {children}
    </CvContext.Provider>
  );
};

export function useCv() {
  const context = useContext(CvContext);
  if (!context) {
    throw new Error('useCv must be used within a CvProvider');
  }
  return context;
}
