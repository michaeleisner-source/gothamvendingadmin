import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Prospects() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Prospects</h1>
          <p className="text-muted-foreground">Manage potential vending machine locations</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Prospect
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Prospects management functionality will be available soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}