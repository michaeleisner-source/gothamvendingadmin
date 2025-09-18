import { useEffect, useState } from "react";

export type Toast = { id: number; type: "success" | "error"; msg: string };
let pushExternal: ((t: Omit<Toast, "id">) => void) | null = null;

export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    pushExternal = (t) => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, ...t }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== id));
      }, 3500);
    };
    return () => { pushExternal = null; };
  }, []);
  return (
    <div className="fixed z-50 bottom-4 right-4 space-y-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`min-w-[240px] max-w-[360px] border rounded-lg px-3 py-2 shadow ${
            t.type === "success" ? "bg-green-50 border-green-400 text-green-900"
                                 : "bg-red-50 border-red-400 text-red-900"
          }`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export function toastSuccess(msg: string) {
  pushExternal?.({ type: "success", msg });
}

export function toastError(msg: string) {
  pushExternal?.({ type: "error", msg });
}