import { Header } from "@/components/ui/Header";
import { FiltersBar } from "@/components/ui/FiltersBar";
import { SummaryCards } from "@/components/ui/SummaryCards";
import { DataTable } from "@/components/ui/DataTable";

export default function FinanceTaxes() {
  return (
    <div className="p-4 space-y-4">
      <Header title="Taxes" subtitle="Sales tax configuration & liability summary" />
      <FiltersBar />
      <SummaryCards items={[
        { label: 'Jurisdictions', value: '—' },
        { label: 'Collected (period)', value: '$—' },
        { label: 'Remitted (period)', value: '$—' },
        { label: 'Outstanding', value: '$—' },
      ]} />
      <DataTable
        columns={["Jurisdiction", "Rate", "Applies To", "Effective From", "Effective To", "Actions"]}
        data={[]}
      />
    </div>
  );
}