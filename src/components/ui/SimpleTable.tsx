import React from 'react';

export type Col<T> = { key: keyof T & string; label: string; align?: 'left'|'right'|'center'; width?: number|string };

export default function SimpleTable<T extends Record<string, any>>(
  { columns, rows }: { columns: Col<T>[]; rows: T[] }
) {
  return (
    <div className="gv-table" style={{overflow:'auto', border:'1px solid #e5e7eb', borderRadius:12}}>
      <table style={{borderCollapse:'separate', borderSpacing:0, width:'100%'}}>
        <thead style={{position:'sticky', top:0, background:'#f8fafc', zIndex:1}}>
          <tr>
            {columns.map(c => (
              <th key={c.key}
                  style={{textAlign:c.align||'left', padding:'10px 12px', fontSize:12, color:'#64748b', position:'sticky', top:0, background:'#f8fafc', width:c.width}}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{borderTop:'1px solid #f1f5f9'}}>
              {columns.map(c => (
                <td key={c.key} style={{textAlign:c.align||'left', padding:'10px 12px'}}>
                  {String(r[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}