import { useEffect } from 'react';

/** Pushes a custom title into the Breadcrumbs header slot. */
export function useBreadcrumbTitle(title?: string | null) {
  useEffect(() => {
    if (!title) return;
    window.dispatchEvent(new CustomEvent('gv:pageTitle', { detail: { title } }));
  }, [title]);
}