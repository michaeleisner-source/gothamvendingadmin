import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Key, Server, Zap, Database, Activity, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_ENDPOINTS = [
  {
    name: "Machine Telemetry",
    path: "/machine-telemetry",
    method: "POST",
    description: "Send machine health data, temperature, error codes, and status updates",
    icon: Activity,
    status: "active"
  },
  {
    name: "Sales Recording",
    path: "/machine-sales", 
    method: "POST",
    description: "Record vending transactions and payment information",
    icon: Database,
    status: "active"
  },
  {
    name: "Inventory Sync",
    path: "/machine-inventory-sync",
    method: "POST", 
    description: "Update slot quantities and trigger low-stock alerts",
    icon: RefreshCw,
    status: "active"
  },
  {
    name: "Status Updates",
    path: "/machine-status",
    method: "POST",
    description: "Update machine operational status and maintenance flags",
    icon: Server,
    status: "active"
  }
];

const EXAMPLE_PAYLOAD = {
  "machine-telemetry": {
    machine_serial: "VM3000-001",
    temperature: 38.5,
    cash_level_cents: 12550,
    error_codes: ["E001", "W003"],
    network_status: "online",
    door_open_alerts: 2,
    power_cycles: 1
  },
  "machine-sales": {
    machine_serial: "VM3000-001", 
    product_slot: "A1",
    product_id: "uuid-here",
    quantity: 1,
    amount_cents: 150,
    payment_method: "card",
    transaction_id: "TXN123456"
  },
  "machine-inventory-sync": {
    machine_serial: "VM3000-001",
    slot_updates: [
      { slot: "A1", quantity: 8 },
      { slot: "B2", quantity: 3 },
      { slot: "C1", quantity: 0 }
    ]
  },
  "machine-status": {
    machine_serial: "VM3000-001",
    status: "maintenance_required",
    maintenance_notes: "Coin mechanism jammed"
  }
};

export default function MachineAPIManagement() {
  const { toast } = useToast();
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "API endpoint copied successfully",
    });
  };

  const copyPayload = (endpoint: string) => {
    const payload = EXAMPLE_PAYLOAD[endpoint as keyof typeof EXAMPLE_PAYLOAD];
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast({
      title: "Example payload copied",
      description: "Use this as a template for your API calls",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Machine API Management</h1>
          <p className="text-muted-foreground">
            Integration endpoints for vending machine connectivity
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/docs/MACHINE_API.md" target="_blank" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            View Documentation
          </a>
        </Button>
      </div>

      {/* API Key Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">API Base URL</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 p-2 bg-muted rounded text-sm">
                https://wmbrnfocnlkhqflliaup.supabase.co/functions/v1
              </code>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard("https://wmbrnfocnlkhqflliaup.supabase.co/functions/v1")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Authorization Header</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 p-2 bg-muted rounded text-sm">
                Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYnJuZm9jbmxraHFmbGxpYXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3ODIwNjEsImV4cCI6MjA3MzM1ODA2MX0.Wzt4HcA_I6xEV9CfvxrC4X97Z1dlUU4OGkX1t5m0rWE
              </code>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYnJuZm9jbmxraHFmbGxpYXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3ODIwNjEsImV4cCI6MjA3MzM1ODA2MX0.Wzt4HcA_I6xEV9CfvxrC4X97Z1dlUU4OGkX1t5m0rWE")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <div className="grid gap-6">
        {API_ENDPOINTS.map((endpoint) => (
          <Card key={endpoint.path}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <endpoint.icon className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                  </div>
                </div>
                <Badge variant={endpoint.status === 'active' ? 'default' : 'secondary'}>
                  {endpoint.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{endpoint.method}</Badge>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {endpoint.path}
                </code>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(`https://wmbrnfocnlkhqflliaup.supabase.co/functions/v1${endpoint.path}`)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Example Payload:</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyPayload(endpoint.path.replace('/', '').replace('-', '_'))}
                  >
                    Copy JSON
                  </Button>
                </div>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(EXAMPLE_PAYLOAD[endpoint.path.replace('/', '').replace('-', '_') as keyof typeof EXAMPLE_PAYLOAD], null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">4</div>
              <div className="text-sm text-muted-foreground">Active Endpoints</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Connected Machines</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">API Calls Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">100%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}