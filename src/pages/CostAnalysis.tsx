import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function CostAnalysis() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cost Analysis</h1>
        <p className="text-muted-foreground">
          Analyze costs and profitability across your operations
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Cost analysis is not available with the current simplified database schema.
          This feature requires detailed sales and inventory data.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Cost Analysis Overview</CardTitle>
          <CardDescription>
            Track costs, margins, and profitability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Cost analysis requires sales data with product costs, quantities, and pricing
            that are not available in the current simplified schema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}