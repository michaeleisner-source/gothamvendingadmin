export default function ChangelogPage() {
  const items = [
    { date:'2025-09-16', text:'New shell (nav, header, breadcrumbs), light theme, toasts, global date range.' },
    { date:'2025-09-16', text:'Reports: Trends, Stock-outs, Exports page scaffold.' },
    { date:'2025-09-16', text:'Route scaffolds: Leads, Installs, Service, Admin, Glossary, Changelog.' },
  ];
  return (
    <div className="card">
      <div style={{fontWeight:700, marginBottom:6}}>What's New</div>
      <ul style={{margin:0, paddingLeft:18}}>
        {items.map(i => <li key={i.text}><b>{i.date}:</b> {i.text}</li>)}
      </ul>
    </div>
  );
}