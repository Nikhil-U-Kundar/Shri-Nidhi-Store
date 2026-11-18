import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  label: string;
  onClose: () => void;
  /** Tailwind width classes applied from `sm` upwards, e.g. "sm:max-w-md". */
  size?: string;
  children: ReactNode;
}

/**
 * Responsive dialog: a bottom sheet on phones, a centred card from `sm` upwards.
 * Closes on Escape and on backdrop click; the content scrolls inside the panel.
 */
export function Modal({ label, onClose, size = 'sm:max-w-md', children }: ModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/70 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-stone-200 bg-white shadow-2xl sm:rounded-3xl ${size}`}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
