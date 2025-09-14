import { Header } from "@/components/ui/Header";
import { FiltersBar } from "@/components/ui/FiltersBar";
import { SummaryCards } from "@/components/ui/SummaryCards";
import { DataTable } from "@/components/ui/DataTable";

export default function ComplianceLicenses() {
  return (
    <div className="p-4 space-y-4">
      <Header title="Compliance & Licenses" subtitle="Permits, inspections, insurance & alerts" />
      <FiltersBar />
      <SummaryCards items={[
        { label: 'Active Licenses', value: '—' },
        { label: 'Expiring < 30d', value: '—' },
        { label: 'Insurance Policies', value: '—' },
        { label: 'Violations Outstanding', value: '—' },
      ]} />
      <DataTable
        columns={["Type", "Jurisdiction", "ID / Policy #", "Effective", "Expires", "Linked Machines/Locations"]}
        data={[]}
      />
    </div>
  );
}