import * as React from "react";

export default function CashCollectionManager(){
  React.useEffect(()=>{ window.dispatchEvent(new CustomEvent("breadcrumbs:set",{detail:{title:"Cash Collection"}})); },[]);
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">Cash Collection</h1>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-[680px] w-full text-sm">
          <thead className="bg-gray-50"><tr className="text-left">
            <th className="p-2">Date</th><th className="p-2">Collector</th><th className="p-2">Route</th><th className="p-2">Machines</th><th className="p-2">Amount</th>
          </tr></thead>
          <tbody>
            <tr><td className="p-2">2025-09-17</td><td className="p-2">E. Ramirez</td><td className="p-2">Route A</td><td className="p-2">4</td><td className="p-2">$382.00</td></tr>
            <tr className="bg-gray-50/60"><td className="p-2">2025-09-16</td><td className="p-2">T. Chen</td><td className="p-2">Route B</td><td className="p-2">3</td><td className="p-2">$261.50</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}