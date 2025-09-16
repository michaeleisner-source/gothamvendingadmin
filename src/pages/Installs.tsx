export default function InstallsPage() {
  return (
    <div>
      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:700, marginBottom:6}}>Installs Pipeline</div>
        <div style={{color:'var(--muted)'}}>Survey → Contract → Install Scheduled → Live.</div>
      </div>
      <div className="card">
        <table className="gv-table">
          <thead>
            <tr><th>Location</th><th>Stage</th><th>Owner</th><th>Updated</th></tr>
          </thead>
          <tbody>
            <tr><td colSpan={4} style={{color:'var(--muted)', padding:'12px'}}>No installs in progress.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}