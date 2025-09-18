import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function DailyOps() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Daily Operations</h1>
        <p className="text-muted-foreground">
          Monitor daily operations and activities
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Daily operations tracking is not available with the current simplified database schema.
          This feature requires detailed operational data.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Operations Overview</CardTitle>
          <CardDescription>
            Track daily operations, sales, and maintenance activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Daily operations require sales data, machine status, and operational metrics
            that are not available in the current simplified schema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}