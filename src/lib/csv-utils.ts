export function toCSV(rows: any[]) {
  if (!rows?.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = (v:any) => `"${String(v ?? '').replace(/"/g,'""')}"`;
  return [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
}

export function downloadCSV(name: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}-${new Date().toISOString().replace(/[:.]/g,'-')}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Legacy compatibility functions
export function toCsv(rows: any[], headerOrder?: string[]): string {
  return toCSV(rows);
}

export function downloadCsv(filename: string, rows: any[], headerOrder?: string[]): void {
  const csv = toCSV(rows);
  downloadCSV(filename.replace('.csv', ''), csv);
}

export function formatCsvFilename(baseName: string, extension: string = 'csv'): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  return `${baseName}_${timestamp}.${extension}`;
}

export function downloadCsvWithTimestamp(baseName: string, rows: any[], headerOrder?: string[]): void {
  const csv = toCSV(rows);
  downloadCSV(baseName, csv);
}