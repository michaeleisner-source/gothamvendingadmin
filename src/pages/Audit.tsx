import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Download, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";

// Types
type Product = {
  id: string;
  sku: string;
  name: string;
  category?: string;
  manufacturer?: string;
  cost?: number;
  price?: number;
  org_id: string;
};

type Machine = {
  id: string;
  name: string;
  status: string;
  location?: string;
  org_id: string;
};

type MachineSlot = {
  id: string;
  machine_id: string;
  label: string;
  capacity?: number;
};

type SlotAssignment = {
  id: string;
  slot_id: string;
  product_id: string;
  max_qty?: number;
  restock_threshold?: number;
};

type Sale = {
  id: string;
  machine_id: string;
  product_id: string;
  qty: number;
  unit_price_cents: number;
  unit_cost_cents?: number;
  occurred_at: string;
};

type AuditIssue = {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: string;
  description: string;
  details: any;
};

const AuditDashboard = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [issues, setIssues] = useState<AuditIssue[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineSlots, setMachineSlots] = useState<MachineSlot[]>([]);
  const [slotAssignments, setSlotAssignments] = useState<SlotAssignment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const fetchAllData = async () => {
    try {
      const [productsRes, machinesRes, slotsRes, assignmentsRes, salesRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('machines').select('*'),
        supabase.from('machine_slots').select('*'),
        supabase.from('slot_assignments').select('*'),
        supabase.from('sales').select('*').order('occurred_at', { ascending: false }).limit(1000)
      ]);

      if (productsRes.error) throw productsRes.error;
      if (machinesRes.error) throw machinesRes.error;
      if (slotsRes.error) throw slotsRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;
      if (salesRes.error) throw salesRes.error;

      setProducts(productsRes.data || []);
      setMachines(machinesRes.data || []);
      setMachineSlots(slotsRes.data || []);
      setSlotAssignments(assignmentsRes.data || []);
      setSales(salesRes.data || []);

      return {
        products: productsRes.data || [],
        machines: machinesRes.data || [],
        slots: slotsRes.data || [],
        assignments: assignmentsRes.data || [],
        sales: salesRes.data || []
      };
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };

  const runAudit = async () => {
    setIsRunning(true);
    setIssues([]);

    try {
      const data = await fetchAllData();
      const auditIssues: AuditIssue[] = [];

      // 1. Products without pricing
      data.products.forEach(product => {
        if (!product.cost || product.cost <= 0) {
          auditIssues.push({
            id: `product-cost-${product.id}`,
            type: 'warning',
            category: 'Pricing',
            description: `Product "${product.name}" has no cost defined`,
            details: product
          });
        }
        if (!product.price || product.price <= 0) {
          auditIssues.push({
            id: `product-price-${product.id}`,
            type: 'error',
            category: 'Pricing',
            description: `Product "${product.name}" has no selling price defined`,
            details: product
          });
        }
        if (product.cost && product.price && product.price <= product.cost) {
          auditIssues.push({
            id: `product-margin-${product.id}`,
            type: 'warning',
            category: 'Profitability',
            description: `Product "${product.name}" has negative/zero margin (Cost: $${product.cost}, Price: $${product.price})`,
            details: product
          });
        }
      });

      // 2. Machines without slots
      data.machines.forEach(machine => {
        const machineSlots = data.slots.filter(slot => slot.machine_id === machine.id);
        if (machineSlots.length === 0) {
          auditIssues.push({
            id: `machine-slots-${machine.id}`,
            type: 'error',
            category: 'Configuration',
            description: `Machine "${machine.name}" has no slots configured`,
            details: machine
          });
        }
      });

      // 3. Slots without product assignments
      data.slots.forEach(slot => {
        const assignment = data.assignments.find(a => a.slot_id === slot.id);
        if (!assignment) {
          auditIssues.push({
            id: `slot-assignment-${slot.id}`,
            type: 'warning',
            category: 'Configuration',
            description: `Slot ${slot.label} has no product assigned`,
            details: slot
          });
        }
      });

      // 4. Orphaned slot assignments (product doesn't exist)
      data.assignments.forEach(assignment => {
        const product = data.products.find(p => p.id === assignment.product_id);
        if (!product) {
          auditIssues.push({
            id: `orphan-assignment-${assignment.id}`,
            type: 'error',
            category: 'Data Integrity',
            description: `Slot assignment references non-existent product`,
            details: assignment
          });
        }
      });

      // 5. Sales with missing cost data
      data.sales.forEach(sale => {
        if (!sale.unit_cost_cents) {
          auditIssues.push({
            id: `sale-cost-${sale.id}`,
            type: 'warning',
            category: 'Profitability',
            description: `Sale missing cost data, profit calculation incomplete`,
            details: sale
          });
        }
      });

      // 6. Inactive machines with recent sales
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      data.machines.forEach(machine => {
        if (machine.status === 'OFFLINE' || machine.status === 'MAINTENANCE') {
          const recentSales = data.sales.filter(sale => 
            sale.machine_id === machine.id && 
            new Date(sale.occurred_at) > thirtyDaysAgo
          );
          if (recentSales.length > 0) {
            auditIssues.push({
              id: `inactive-machine-sales-${machine.id}`,
              type: 'warning',
              category: 'Operations',
              description: `Machine "${machine.name}" is marked as ${machine.status} but has ${recentSales.length} recent sales`,
              details: { machine, recentSales: recentSales.length }
            });
          }
        }
      });

      setIssues(auditIssues);
      setLastRun(new Date());
      toast.success(`Audit completed: ${auditIssues.length} issues found`);

    } catch (error: any) {
      console.error('Audit failed:', error);
      toast.error(`Audit failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const exportIssues = (category?: string) => {
    const filteredIssues = category ? issues.filter(i => i.category === category) : issues;
    
    if (filteredIssues.length === 0) {
      toast.error('No issues to export');
      return;
    }

    const headers = ['Type', 'Category', 'Description', 'Details'];
    const csvContent = [
      headers.join(','),
      ...filteredIssues.map(issue => [
        issue.type,
        issue.category,
        `"${issue.description}"`,
        `"${JSON.stringify(issue.details).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-issues-${category || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const issuesByCategory = useMemo(() => {
    const categories: Record<string, AuditIssue[]> = {};
    issues.forEach(issue => {
      if (!categories[issue.category]) {
        categories[issue.category] = [];
      }
      categories[issue.category].push(issue);
    });
    return categories;
  }, [issues]);

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">System Audit Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive audit of data integrity and business operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runAudit} disabled={isRunning}>
            {isRunning ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isRunning ? 'Running...' : 'Run Audit'}
          </Button>
          <Button onClick={() => exportIssues()} variant="outline" disabled={issues.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {lastRun && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last audit run</p>
                <p className="text-lg font-medium">{lastRun.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total issues found</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{issues.length}</p>
                  <div className="flex gap-1">
                    <Badge variant="destructive">{issues.filter(i => i.type === 'error').length}</Badge>
                    <Badge variant="secondary">{issues.filter(i => i.type === 'warning').length}</Badge>
                    <Badge variant="outline">{issues.filter(i => i.type === 'info').length}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {issues.length > 0 && (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Issues ({issues.length})</TabsTrigger>
            {Object.keys(issuesByCategory).map(category => (
              <TabsTrigger key={category} value={category}>
                {category} ({issuesByCategory[category].length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>All Issues</CardTitle>
                  <Button onClick={() => exportIssues()} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.map(issue => (
                      <TableRow key={issue.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getIssueIcon(issue.type)}
                            <Badge variant={getBadgeVariant(issue.type) as any}>
                              {issue.type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{issue.category}</TableCell>
                        <TableCell className="max-w-md">{issue.description}</TableCell>
                        <TableCell>
                          <details className="text-xs">
                            <summary className="cursor-pointer">View</summary>
                            <pre className="mt-2 text-xs bg-muted p-2 rounded">
                              {JSON.stringify(issue.details, null, 2)}
                            </pre>
                          </details>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {Object.entries(issuesByCategory).map(([category, categoryIssues]) => (
            <TabsContent key={category} value={category}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{category} Issues</CardTitle>
                    <Button onClick={() => exportIssues(category)} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryIssues.map(issue => (
                        <TableRow key={issue.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getIssueIcon(issue.type)}
                              <Badge variant={getBadgeVariant(issue.type) as any}>
                                {issue.type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">{issue.description}</TableCell>
                          <TableCell>
                            <details className="text-xs">
                              <summary className="cursor-pointer">View</summary>
                              <pre className="mt-2 text-xs bg-muted p-2 rounded">
                                {JSON.stringify(issue.details, null, 2)}
                              </pre>
                            </details>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {issues.length === 0 && lastRun && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Issues Found!</h3>
            <p className="text-muted-foreground">
              Your system audit completed successfully with no issues detected.
            </p>
          </CardContent>
        </Card>
      )}

      {!lastRun && (
        <Card>
          <CardContent className="text-center py-8">
            <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Audit</h3>
            <p className="text-muted-foreground mb-4">
              Click "Run Audit" to perform a comprehensive system check including:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 max-w-md mx-auto">
              <li>• Product pricing and profitability analysis</li>
              <li>• Machine configuration validation</li>
              <li>• Slot assignment integrity checks</li>
              <li>• Data consistency verification</li>
              <li>• Operational efficiency review</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuditDashboard;