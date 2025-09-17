import * as React from "react";

export default function RestockEntry(){
  React.useEffect(()=>{ window.dispatchEvent(new CustomEvent("breadcrumbs:set",{detail:{title:"Restock Entry"}})); },[]);
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">Restock Entry</h1>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-[680px] w-full text-sm">
          <thead className="bg-gray-50"><tr className="text-left">
            <th className="p-2">Date</th><th className="p-2">Route</th><th className="p-2">Machine</th><th className="p-2">SKU</th><th className="p-2">Qty</th>
          </tr></thead>
          <tbody>
            <tr><td className="p-2">2025-09-17</td><td className="p-2">Route A</td><td className="p-2">M-001</td><td className="p-2">Water 16oz</td><td className="p-2">24</td></tr>
            <tr className="bg-gray-50/60"><td className="p-2">2025-09-17</td><td className="p-2">Route B</td><td className="p-2">M-004</td><td className="p-2">Candy Bar</td><td className="p-2">36</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}