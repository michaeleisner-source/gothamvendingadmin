import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function Installs() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Installation Management"
        description="Track machine installations and deployments"
      />

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">Installation Tracker</h3>
            <p>Schedule, track, and manage machine installations at locations.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}