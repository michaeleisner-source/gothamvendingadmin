export default function OverviewSmoke() {
  return (
    <div style={{padding:16}}>
      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:700}}>QA Overview — Smoke Test</div>
        <div style={{color:'var(--muted)'}}>If you can see this, routing works.</div>
      </div>
      <div className="card">
        <p>Next step: we'll swap this for the real audit UI.</p>
      </div>
    </div>
  );
}