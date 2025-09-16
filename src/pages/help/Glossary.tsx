export default function Glossary() {
  const rows = [
    ['Revenue', 'Σ(qty × price)'],
    ['COGS', 'Σ(qty × cost)'],
    ['Profit', 'Revenue − COGS'],
    ['Profit %', 'Profit ÷ Revenue'],
    ['Velocity/day', 'Units ÷ days in window'],
  ];
  return (
    <div className="card">
      <div style={{fontWeight:700, marginBottom:6}}>Glossary</div>
      <table className="gv-table">
        <thead><tr><th>Term</th><th>Definition</th></tr></thead>
        <tbody>
          {rows.map(([t,d]) => <tr key={t}><td>{t}</td><td>{d}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}