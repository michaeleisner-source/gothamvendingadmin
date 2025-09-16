import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function Users() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management"
        description="Manage user accounts, roles, and permissions"
      />

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">User Administration</h3>
            <p>Create, edit, and manage user accounts and access permissions.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}