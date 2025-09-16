import { useEffect, useState } from 'react';

type ToastKind = 'success' | 'warning' | 'error' | 'info';

export type Toast = {
  id: string;
  kind: ToastKind;
  title?: string;
  message?: string;
  timeoutMs?: number; // default 3500
};

let pushFn: ((t: Omit<Toast, 'id'>) => void) | null = null;

/** Programmatic API: window.gToast.push({ kind:'success', title:'Saved' }) */
declare global {
  interface Window {
    gToast: { push: (t: Omit<Toast, 'id'>) => void };
  }
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    pushFn = (t) => {
      const toast: Toast = {
        id: crypto.randomUUID(),
        timeoutMs: 3500,
        ...t,
      };
      setItems((arr) => [...arr, toast]);
      // auto-remove
      setTimeout(() => {
        setItems((arr) => arr.filter((x) => x.id !== toast.id));
      }, toast.timeoutMs);
    };
    window.gToast = { push: (t) => pushFn?.(t) };

    // Event bridge: window.dispatchEvent(new CustomEvent('gv:notify', { detail: { kind:'success', title:'Saved!' } }))
    const onNotify = (e: Event) => {
      const { kind = 'info', title, message, timeoutMs } =
        (e as CustomEvent).detail || {};
      pushFn?.({ kind, title, message, timeoutMs });
    };
    window.addEventListener('gv:notify', onNotify);
    return () => {
      window.removeEventListener('gv:notify', onNotify);
      pushFn = null;
    };
  }, []);

  return (
    <div className="gv-toaster-wrap" aria-live="polite" aria-atomic="true">
      {items.map((t) => (
        <div key={t.id} className={`gv-toast gv-${t.kind}`} role="status">
          <div className="gv-toast-icon">
            {t.kind === 'success' ? '✅' :
             t.kind === 'warning' ? '⚠️' :
             t.kind === 'error'   ? '⛔' : 'ℹ️'}
          </div>
          <div className="gv-toast-body">
            {t.title && <div className="gv-toast-title">{t.title}</div>}
            {t.message && <div className="gv-toast-msg">{t.message}</div>}
          </div>
          <button
            className="gv-toast-close"
            onClick={() => setItems((arr) => arr.filter((x) => x.id !== t.id))}
            aria-label="Dismiss"
            title="Dismiss"
          >✕</button>
        </div>
      ))}
    </div>
  );
}
