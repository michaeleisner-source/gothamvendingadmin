import { useEffect, useState } from 'react';

/** Subscribes to the global date-range (days). Defaults to localStorage or 30. */
export function useGlobalDays() {
  const getInitial = () => {
    const saved = localStorage.getItem('gv:dateRangeDays');
    return saved ? Number(saved) : 30;
  };

  const [days, setDays] = useState<number>(getInitial);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { days?: number };
      if (typeof detail?.days === 'number') setDays(detail.days);
    };
    window.addEventListener('gv:dateRangeChange', handler);
    return () => window.removeEventListener('gv:dateRangeChange', handler);
  }, []);

  return days;
}