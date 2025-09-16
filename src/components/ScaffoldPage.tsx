type Props = {
  title: string;
  description?: string;
  columns?: string[]; // if provided, shows an empty table with these headers
};

export default function ScaffoldPage({ title, description, columns }: Props) {
  return (
    <div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
        {description && <div style={{ color: 'var(--muted)' }}>{description}</div>}
      </div>

      {columns && (
        <div className="card">
          <table className="gv-table">
            <thead>
              <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={columns.length} style={{ color: 'var(--muted)', padding: '12px' }}>
                  No data yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}