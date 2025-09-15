import { Search, Filter, ChevronDown } from "lucide-react";

interface ProspectFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  stage: string;
  onStageChange: (value: string) => void;
  source: string;
  onSourceChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
  stages: string[];
  sources: string[];
}

export function ProspectFilters({
  searchTerm,
  onSearchChange,
  stage,
  onStageChange,
  source,
  onSourceChange,
  filteredCount,
  totalCount,
  stages,
  sources
}: ProspectFiltersProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name, company, contact, email, city…"
            className="pl-8 pr-3 py-2 text-sm rounded-md bg-background border border-border min-w-[260px]"
          />
        </div>
        <FilterSelect 
          value={stage} 
          onChange={onStageChange} 
          label="Stage" 
          options={["all", ...stages]} 
        />
        <FilterSelect 
          value={source} 
          onChange={onSourceChange} 
          label="Source" 
          options={["all", ...sources]} 
        />
        <div className="ml-auto text-xs text-muted-foreground flex items-center gap-2">
          <Filter className="h-4 w-4" /> {filteredCount} shown / {totalCount} total
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ 
  value, 
  onChange, 
  label, 
  options 
}: { 
  value: string; 
  onChange: (v: string) => void; 
  label: string; 
  options: string[] 
}) {
  const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="relative">
        <select
          className="appearance-none rounded-md bg-background border border-border px-3 py-2 pr-8 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{title(opt)}</option>
          ))}
        </select>
        <ChevronDown className="h-4 w-4 absolute right-2 top-2.5 text-muted-foreground pointer-events-none" />
      </div>
    </label>
  );
}