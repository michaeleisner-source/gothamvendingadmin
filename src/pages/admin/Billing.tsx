import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function Billing() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Billing & Subscriptions"
        description="Manage subscription plans and billing information"
      />

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">Billing Management</h3>
            <p>View subscription details, billing history, and payment methods.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}