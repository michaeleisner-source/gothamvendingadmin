import * as React from "react";
export default function DeliveryRoutes(){
  React.useEffect(()=>{ window.dispatchEvent(new CustomEvent("breadcrumbs:set",{detail:{title:"Delivery Routes"}})); },[]);
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">Delivery Routes</h1>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-[680px] w-full text-sm">
          <thead className="bg-gray-50"><tr className="text-left">
            <th className="p-2">Route</th><th className="p-2">Stops</th><th className="p-2">Est. Time</th><th className="p-2">Driver</th><th className="p-2">Status</th>
          </tr></thead>
          <tbody>
            <tr><td className="p-2">Route A</td><td className="p-2">Manhattan Tech Hub → Queens University</td><td className="p-2">2h 10m</td><td className="p-2">E. Ramirez</td><td className="p-2">Planned</td></tr>
            <tr className="bg-gray-50/60"><td className="p-2">Route B</td><td className="p-2">Brooklyn Hospital → Jersey Logistics</td><td className="p-2">1h 45m</td><td className="p-2">T. Chen</td><td className="p-2">In Progress</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}