export default function ScaffoldPage({ title }: { title: string }) {
  return (
    <div className="card" style={{padding:16}}>
      <div style={{fontWeight:800}}>{title}</div>
      <div style={{color:'#64748b'}}>Scaffold placeholder — content coming next.</div>
    </div>
  );
}