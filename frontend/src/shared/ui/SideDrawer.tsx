import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface SideDrawerProps {
  id?: string;
  label: string;
  onClose: () => void;
  /** Hidden from md upward by default; pass false to keep it visible on every size. */
  mobileOnly?: boolean;
  children: ReactNode;
}

/** Full-height panel that slides in from the left over a backdrop. Closes on backdrop, close button or Escape. */
export function SideDrawer({ id, label, onClose, mobileOnly = true, children }: SideDrawerProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div id={id} className={`fixed inset-0 z-50 ${mobileOnly ? 'md:hidden' : ''}`}>
      <button type="button" onClick={onClose} aria-label={`Close ${label}`} className="absolute inset-0 cursor-pointer bg-stone-950/60 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
          <span className="text-sm font-black tracking-tight text-stone-900">
            SRI NIDHI <span className="text-emerald-700">STORE</span>
          </span>
          <button type="button" onClick={onClose} aria-label={`Close ${label}`} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
