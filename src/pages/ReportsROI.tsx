import { Header } from "@/components/ui/Header";
import { FiltersBar } from "@/components/ui/FiltersBar";
import { SummaryCards } from "@/components/ui/SummaryCards";
import { DataTable } from "@/components/ui/DataTable";

export default function ReportsROI() {
  return (
    <div className="p-4 space-y-4">
      <Header title="ROI & Depreciation" subtitle="Investment, depreciation, break-even by machine" />
      <FiltersBar />
      <SummaryCards items={[
        { label: 'Total Invested', value: '$—' },
        { label: 'Monthly Depreciation', value: '$—' },
        { label: 'Avg Break-even (mo)', value: '—' },
        { label: 'Operating Profit (period)', value: '$—' },
      ]} />
      <DataTable
        columns={["Machine", "Location", "Invested", "Book Value", "Depreciation/mo", "Profit/mo", "Break-even (mo)"]}
        data={[]}
      />
    </div>
  );
}