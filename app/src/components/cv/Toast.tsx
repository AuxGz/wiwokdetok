import React from 'react';

interface ToastProps {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: (id: string) => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  actionLabel,
  onAction,
  onClose,
  duration = 6000,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div
      role="alert"
      className="flex items-center gap-3 px-4 py-3 bg-[#1F2937] text-white rounded-xl shadow-lg border border-neutral-700/60 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto"
    >
      <span className="font-medium text-neutral-100">{message}</span>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={() => {
            onAction();
            onClose(id);
          }}
          className="ml-auto px-2.5 py-1 rounded bg-[#ED1E28] hover:bg-[#D0161F] text-white font-semibold text-xs transition-colors shrink-0"
        >
          {actionLabel}
        </button>
      )}
      <button
        type="button"
        onClick={() => onClose(id)}
        aria-label="Tutup notifikasi"
        className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors shrink-0 ml-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{
  toasts: Array<{
    id: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    duration?: number;
  }>;
  onClose: (id: string) => void;
}> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};
