import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function Service() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Service Management"
        description="Track maintenance, repairs, and service calls"
      />

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">Service Operations</h3>
            <p>Manage maintenance schedules, service calls, and machine repairs.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}