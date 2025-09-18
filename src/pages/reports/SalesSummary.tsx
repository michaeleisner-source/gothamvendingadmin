import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function SalesSummary() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Summary</h1>
        <p className="text-muted-foreground">
          Comprehensive sales reporting and summaries
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Sales summary reporting is not available with the current simplified database schema.
          This feature requires detailed sales data.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
          <CardDescription>
            Sales summary reports and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Sales summary reporting requires detailed transaction data, product information, and revenue metrics
            that are not available in the current simplified schema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}