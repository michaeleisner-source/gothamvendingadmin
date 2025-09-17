import React from 'react';
import { MoverRow } from '@/lib/analytics-utils';

type MiniTableProps = {
  title: string;
  rows: MoverRow[];
};

const cardStyle = { 
  background: '#fff', 
  border: '1px solid #e5e7eb', 
  borderRadius: 12, 
  padding: 16 
};

/**
 * Displays a compact table for showing top movers (gainers/decliners)
 * Shows current vs previous period comparison with delta and percentage change
 */
export default function MiniTable({ title, rows }: MiniTableProps) {
  return (
    <div className="card" style={cardStyle}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Revenue (curr vs prev)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 6, fontSize: 13 }}>
        <div style={{ fontWeight: 700, color: '#0f172a' }}>Name</div>
        <div style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>Curr</div>
        <div style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>Prev</div>
        <div style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>Δ</div>
        <div style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>%</div>
        {rows.length === 0 && <div style={{ gridColumn: '1 / -1', color: '#64748b' }}>No data</div>}
        {rows.map((r) => (
          <React.Fragment key={r.key}>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.key}</div>
            <div style={{ textAlign: 'right' }}>${r.curr.toFixed(2)}</div>
            <div style={{ textAlign: 'right', color: '#64748b' }}>${r.prev.toFixed(2)}</div>
            <div style={{ textAlign: 'right', color: r.delta >= 0 ? '#16a34a' : '#dc2626' }}>
              {r.delta >= 0 ? '+' : ''}
              {r.delta.toFixed(2)}
            </div>
            <div style={{ textAlign: 'right', color: r.delta >= 0 ? '#16a34a' : '#dc2626' }}>{r.pct}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}