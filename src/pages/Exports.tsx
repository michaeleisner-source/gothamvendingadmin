import { useGlobalDays } from '@/hooks/useGlobalDays';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';

export default function ExportsPage(){
  const days = useGlobalDays();

  const call = (fnName: string, hint: string) => {
    const fn = (window as any).exportSalesCSV;
    if (typeof fn === 'function') {
      fn(days, { filenameHint: hint });
    } else {
      window.dispatchEvent(new CustomEvent('gv:notify', {
        detail: { kind:'warning', title:'Export helper not found', message:'Load the global export helper or ask to wire a local exporter.' }
      }));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Data Exports"
        description={`Export CSV reports for the last ${days} days`}
      />

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 max-w-md">
            <Button 
              onClick={() => call('exportSalesCSV', `sales-last-${days}-days`)}
              className="flex items-center gap-2 justify-start"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Sales (CSV)
            </Button>
            
            <Button 
              onClick={() => call('exportSalesCSV', `machines-last-${days}-days`)}
              className="flex items-center gap-2 justify-start"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              Export Machine Performance (CSV)
            </Button>
            
            <Button 
              onClick={() => call('exportSalesCSV', `products-last-${days}-days`)}
              className="flex items-center gap-2 justify-start"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              Export Product Performance (CSV)
            </Button>
            
            <Button 
              onClick={() => call('exportSalesCSV', `locations-last-${days}-days`)}
              className="flex items-center gap-2 justify-start"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              Export Location Performance (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}