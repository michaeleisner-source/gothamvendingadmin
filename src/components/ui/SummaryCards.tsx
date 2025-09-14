interface SummaryCardsProps {
  items: { label: string; value: string }[];
}

export function SummaryCards({ items }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-border bg-muted p-3">
          <div className="text-xs text-muted-foreground">{item.label}</div>
          <div className="text-lg font-medium">{item.value}</div>
        </div>
      ))}
    </div>
  );
}