import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function MachineReports() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Machine Reports"
        description="Detailed analytics and performance metrics for all machines"
      />

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">Machine Analytics</h3>
            <p>Performance metrics, utilization rates, and revenue analysis by machine.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}