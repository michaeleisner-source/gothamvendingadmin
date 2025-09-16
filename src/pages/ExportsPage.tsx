import { useState } from 'react';
import { invokeReport } from '../lib/reportsApi';
import { toCSV, downloadCSV } from '../lib/utils';

async function pull(name: string, fn: string, body: any) {
  const { data, error } = await invokeReport(fn, body);
  if (error) throw new Error(error.message || 'export failed');
  const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [data];
  downloadCSV(name, toCSV(rows));
}

export default function ExportsPage() {
  const [days, setDays] = useState(30);
  const body = { days };
  
  return (
    <div>
      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 800 }}>Exports</div>
        <label>
          Days
          <input 
            className="gv-input" 
            type="number" 
            value={days} 
            min={1} 
            max={365}
            onChange={e => setDays(Math.max(1, Math.min(365, Number(e.target.value) || 30)))} 
            style={{ width: 90, marginLeft: 6 }}
          />
        </label>
      </div>
      
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <button className="btn" onClick={() => pull('gotham-sales', 'reports-sales-detail', body)}>
          Export Sales
        </button>
        <button className="btn" onClick={() => pull('gotham-machines', 'reports-machines', body)}>
          Export Machines
        </button>
        <button className="btn" onClick={() => pull('gotham-products', 'reports-products', body)}>
          Export Products
        </button>
        <button className="btn" onClick={() => pull('gotham-locations', 'reports-locations', body)}>
          Export Locations
        </button>
      </div>
    </div>
  );
}