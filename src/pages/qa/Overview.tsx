import React from 'react';

export default function QAOverview() {
  return (
    <div style={{padding:16}}>
      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:700}}>QA Overview — Smoke Test</div>
        <div style={{color:'var(--muted)'}}>If you can see this card, routing works.</div>
      </div>
      <div className="card">
        <p>Next: we'll replace this with the full QA Overview component.</p>
      </div>
    </div>
  );
}