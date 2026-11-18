import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useToast, type ToastType } from './ToastProvider';

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'border-emerald-700 bg-emerald-900',
  error: 'border-red-700 bg-red-900',
  info: 'border-stone-800 bg-stone-900',
};

function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success') return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />;
  if (type === 'error') return <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />;
  return <Info className="h-4 w-4 shrink-0 text-blue-400" />;
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-[60] space-y-2 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-full sm:max-w-sm"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-2.5 rounded-2xl border p-3.5 text-xs font-bold text-white shadow-2xl ${TOAST_STYLES[toast.type]}`}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <ToastIcon type={toast.type} />
            <span className="break-words">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="shrink-0 cursor-pointer rounded-md p-1 text-stone-400 hover:text-white"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
