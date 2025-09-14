/**
 * CSV Export Utilities
 * Functions for converting data to CSV format and triggering downloads
 */

/**
 * Converts an array of objects to CSV format
 * @param rows - Array of objects to convert
 * @param headerOrder - Optional array to specify column order
 * @returns CSV string
 */
export function toCsv(rows: any[], headerOrder?: string[]): string {
  if (!rows?.length) return "";
  
  const headers = headerOrder ?? Object.keys(rows[0]);
  
  const escape = (v: any): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(","));
  }
  
  return lines.join("\n");
}

/**
 * Downloads data as a CSV file
 * @param filename - Name of the file to download (should include .csv extension)
 * @param rows - Array of objects to export
 * @param headerOrder - Optional array to specify column order
 */
export function downloadCsv(filename: string, rows: any[], headerOrder?: string[]): void {
  const csv = toCsv(rows, headerOrder);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the object URL
  setTimeout(() => URL.revokeObjectURL(link.href), 100);
}

/**
 * Formats a filename with timestamp
 * @param baseName - Base name for the file
 * @param extension - File extension (defaults to 'csv')
 * @returns Formatted filename with timestamp
 */
export function formatCsvFilename(baseName: string, extension: string = 'csv'): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  return `${baseName}_${timestamp}.${extension}`;
}

/**
 * Downloads data with auto-formatted filename
 * @param baseName - Base name for the file
 * @param rows - Array of objects to export
 * @param headerOrder - Optional array to specify column order
 */
export function downloadCsvWithTimestamp(baseName: string, rows: any[], headerOrder?: string[]): void {
  const filename = formatCsvFilename(baseName);
  downloadCsv(filename, rows, headerOrder);
}