import { Header } from "@/components/ui/Header";
import { FiltersBar } from "@/components/ui/FiltersBar";
import { SummaryCards } from "@/components/ui/SummaryCards";
import { DataTable } from "@/components/ui/DataTable";

export default function FinanceExpenses() {
  return (
    <div className="p-4 space-y-4">
      <Header title="Expenses" subtitle="Overhead & non-machine operating expenses" />
      <FiltersBar />
      <SummaryCards items={[
        { label: 'Total Expenses (period)', value: '$—' },
        { label: 'Top Category', value: '—' },
        { label: 'Avg Monthly Burn', value: '$—' },
        { label: 'Runway (cash / burn)', value: '—' },
      ]} />
      <DataTable
        columns={["Date", "Category", "Vendor", "Description", "Amount", "Allocated (Location/Machine)"]}
        data={[]}
      />
    </div>
  );
}