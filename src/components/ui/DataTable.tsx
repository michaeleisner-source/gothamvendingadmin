interface DataTableProps {
  columns: string[];
  data: (string | number)[][];
  loading?: boolean;
}

export function DataTable({ columns, data, loading = false }: DataTableProps) {
  if (loading) {
    return (
      <div className="overflow-auto border border-border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {columns.map((column) => (
                <th key={column} className="text-left px-3 py-2 border-b border-border font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 text-muted-foreground text-center" colSpan={columns.length}>
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Loading...
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-auto border border-border rounded-xl">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            {columns.map((column) => (
              <th key={column} className="text-left px-3 py-2 border-b border-border font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td className="px-3 py-3 text-muted-foreground" colSpan={columns.length}>
                No rows
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="odd:bg-background even:bg-muted/60">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 border-b border-border">
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}