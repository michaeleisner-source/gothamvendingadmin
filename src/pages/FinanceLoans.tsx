import { Header } from "@/components/ui/Header";
import { FiltersBar } from "@/components/ui/FiltersBar";
import { SummaryCards } from "@/components/ui/SummaryCards";
import { DataTable } from "@/components/ui/DataTable";

export default function FinanceLoans() {
  return (
    <div className="p-4 space-y-4">
      <Header title="Loans & Financing" subtitle="Machine and business financing details" />
      <FiltersBar />
      <SummaryCards items={[
        { label: 'Active Loans', value: '—' },
        { label: 'Avg APR', value: '—' },
        { label: 'Monthly Payments', value: '$—' },
        { label: 'Outstanding Principal', value: '$—' },
      ]} />
      <DataTable
        columns={["Lender", "Type", "Term (mo)", "APR", "Monthly", "Principal", "Next Payment"]}
        data={[]}
      />
    </div>
  );
}