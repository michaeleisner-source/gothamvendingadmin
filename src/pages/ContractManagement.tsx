import * as React from "react";

type Contract = {
  id: string;
  location: string;
  split: string;
  start: string;
  status: "Active" | "Pending" | "Expired";
};

const DEMO: Contract[] = [
  { id: "CN-2025-001", location: "Manhattan Tech Hub", split: "80/20", start: "2025-06-01", status: "Active" },
  { id: "CN-2025-002", location: "Brooklyn Hospital",  split: "85/15", start: "2025-07-10", status: "Active" },
  { id: "CN-2025-003", location: "Queens University",   split: "90/10", start: "2025-08-05", status: "Pending" },
];

function Pill({ status }: { status: Contract["status"] }) {
  const map = {
    Active:  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    Pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    Expired: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  } as const;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>{status}</span>;
}

export default function ContractManagement() {
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("breadcrumbs:set", { detail: { title: "Contracts" }}));
  }, []);
  const [q, setQ] = React.useState("");

  const rows = React.useMemo(() => {
    const s = q.toLowerCase();
    return DEMO.filter(r =>
      !s ||
      r.id.toLowerCase().includes(s) ||
      r.location.toLowerCase().includes(s) ||
      r.split.toLowerCase().includes(s) ||
      r.start.toLowerCase().includes(s)
    );
  }, [q]);

  const exportCSV = () => {
    const esc = (x: string) => `"${x.replace(/"/g, '""')}"`;
    const head = ["Contract","Location","Split","Start","Status"].map(esc).join(",");
    const body = rows.map(r => [r.id,r.location,r.split,r.start,r.status].map(esc).join(",")).join("\n");
    const blob = new Blob([head+"\n"+body], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gotham-contracts-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Contracts</h1>
          <p className="text-sm text-muted-foreground">Agreements and revenue splits by location.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="h-9 px-3 rounded-md border text-sm hover:bg-gray-50">Export CSV</button>
          <button onClick={()=>alert("New Contract (demo)")} className="h-9 px-3 rounded-md bg-black text-white text-sm">New Contract</button>
        </div>
      </div>

      <div className="mb-3">
        <input
          className="h-9 w-full sm:w-72 rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
          placeholder="Search contracts…"
          value={q}
          onChange={e=>setQ(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-2 font-medium">Contract</th>
              <th className="p-2 font-medium">Location</th>
              <th className="p-2 font-medium">Split</th>
              <th className="p-2 font-medium">Start</th>
              <th className="p-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={i % 2 ? "bg-gray-50/60" : ""}>
                <td className="p-2">
                  <button className="underline decoration-dotted underline-offset-4" onClick={()=>alert(`Open ${r.id}`)}>{r.id}</button>
                </td>
                <td className="p-2">{r.location}</td>
                <td className="p-2">{r.split}</td>
                <td className="p-2">{r.start}</td>
                <td className="p-2"><Pill status={r.status} /></td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-6 text-center text-muted-foreground" colSpan={5}>No matches</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">Showing {rows.length} of {DEMO.length}</div>
    </div>
  );
}