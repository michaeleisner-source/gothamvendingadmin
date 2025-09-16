export default function LeadsPage() {
  return (
    <div>
      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:700, marginBottom:6}}>Leads (Prospects)</div>
        <div style={{color:'var(--muted)'}}>Manage prospects and convert to Locations.</div>
      </div>
      <div className="card">
        <table className="gv-table">
          <thead>
            <tr><th>Name</th><th>Type</th><th>Status</th><th>Contact</th><th>Created</th></tr>
          </thead>
          <tbody>
            <tr><td colSpan={5} style={{color:'var(--muted)', padding:'12px'}}>No leads yet.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}