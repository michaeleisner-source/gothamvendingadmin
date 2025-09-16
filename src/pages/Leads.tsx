import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function Leads() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Lead Management"
        description="Track and manage potential customers"
      />

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">Lead Management System</h3>
            <p>Track potential customers, follow up on inquiries, and convert leads to prospects.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}