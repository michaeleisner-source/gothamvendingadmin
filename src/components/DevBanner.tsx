// src/components/DevBanner.tsx
export function DevBanner() {
  if (!import.meta.env.DEV) return null; // prod/staging: no banner
  return (
    <div
      data-dev-banner
      className="px-3 py-1 text-xs text-red-700 bg-red-50 border-b border-red-200"
    >
      Dev build
    </div>
  );
}