import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="System Settings"
        description="Configure application settings and preferences"
      />

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">Application Configuration</h3>
            <p>Manage system settings, integrations, and global preferences.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}