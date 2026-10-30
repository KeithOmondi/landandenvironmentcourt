// src/component/Modal.tsx
//
// Simple accessible modal: dark overlay, centered scrollable panel, closes
// on Esc or overlay click, locks page scroll while open.

import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  /** Tailwind max-width class for the panel. */
  widthClass?: string;
}

const Modal = ({ onClose, children, widthClass = 'max-w-3xl' }: ModalProps) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`admin-theme relative my-4 w-full ${widthClass} max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6 [&>div]:border-0 [&>div]:p-0 [&>div]:shadow-none`}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
