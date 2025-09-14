import { Header } from "@/components/ui/Header";
import { FiltersBar } from "@/components/ui/FiltersBar";
import { SummaryCards } from "@/components/ui/SummaryCards";
import { DataTable } from "@/components/ui/DataTable";

export default function ProductMargins() {
  return (
    <div className="p-4 space-y-4">
      <Header title="Product Margins" subtitle="Net profit per SKU after all fees" />
      <FiltersBar />
      <SummaryCards items={[
        { label: 'Avg Unit Margin', value: '$—' },
        { label: 'Top Performer', value: '—' },
        { label: 'Bottom Performer', value: '—' },
        { label: 'Spoilage (period)', value: '$—' },
      ]} />
      <DataTable
        columns={["SKU", "Product", "Price", "Landed Cost", "Card Fee", "Commission Alloc.", "Net Margin", "Velocity (units/day)"]}
        data={[]}
      />
    </div>
  );
}