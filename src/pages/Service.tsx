export default function ServicePage() {
  return (
    <div>
      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:700, marginBottom:6}}>Service & Maintenance</div>
        <div style={{color:'var(--muted)'}}>Track service logs, parts, and downtime.</div>
      </div>
      <div className="card">
        <table className="gv-table">
          <thead>
            <tr><th>Date</th><th>Machine</th><th>Action</th><th>Notes</th><th style={{textAlign:'right'}}>Parts Cost</th></tr>
          </thead>
          <tbody>
            <tr><td colSpan={5} style={{color:'var(--muted)', padding:'12px'}}>No service records yet.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}