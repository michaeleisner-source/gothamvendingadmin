import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function MachineROI() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Machine ROI</h1>
        <p className="text-muted-foreground">
          Machine return on investment analysis
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Machine ROI analysis is not available with the current simplified database schema.
          This feature requires machine and financial data.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>ROI Analysis</CardTitle>
          <CardDescription>
            Machine-specific return on investment calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Machine ROI analysis requires detailed financial data, machine costs, and revenue metrics
            that are not available in the current simplified schema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}