import { Header } from "@/components/ui/Header";
import { FiltersBar } from "@/components/ui/FiltersBar";
import { SummaryCards } from "@/components/ui/SummaryCards";
import { DataTable } from "@/components/ui/DataTable";

export default function FinanceCommissions() {
  return (
    <div className="p-4 space-y-4">
      <Header title="Commissions" subtitle="Location commission contracts & payouts" />
      <FiltersBar />
      <SummaryCards items={[
        { label: 'Locations with contracts', value: '—' },
        { label: 'Unpaid payouts', value: '$—' },
        { label: 'This period commission', value: '$—' },
        { label: 'Model split (Gross / Net / Flat)', value: '—' },
      ]} />
      <DataTable
        columns={["Location", "Model", "%/Flat", "Effective From", "Effective To", "Actions"]}
        data={[]}
      />
    </div>
  );
}