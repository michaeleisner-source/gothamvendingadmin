import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function ProductReports() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Product Reports"
        description="Sales performance and profitability analysis by product"
      />

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">Product Analytics</h3>
            <p>Sales velocity, profit margins, and inventory turnover by product.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}