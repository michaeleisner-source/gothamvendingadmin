import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function MachineFinance() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Machine Finance</h1>
        <p className="text-muted-foreground">
          Track machine financing, payments, and ROI
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Machine finance tracking is not available with the current simplified database schema.
          This feature requires financial and machine data.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>
            Machine financing, payments, and return on investment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Machine finance tracking requires detailed financial data, machine costs, and revenue metrics
            that are not available in the current simplified schema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}