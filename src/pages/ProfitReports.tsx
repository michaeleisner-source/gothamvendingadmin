import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { downloadCsv, formatCsvFilename } from "@/lib/csv-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Building2, 
  Download, 
  Play, 
  RefreshCw,
  BarChart3 
} from "lucide-react";
import { toast } from "sonner";

type ReportSection = {
  title: string;
  data: any[];
  loading: boolean;
  headers?: string[];
  formatters?: { [key: string]: (value: any) => string };
};

export default function ProfitReports() {
  const [dateFrom, setDateFrom] = useState<string>("2025-01-01");
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  
  const [reports, setReports] = useState<{
    inventoryValuation: ReportSection;
    margins: ReportSection;
    machinePerformance: ReportSection;
    productProfitability: ReportSection;
  }>({
    inventoryValuation: { title: "Inventory Valuation", data: [], loading: false },
    margins: { title: "Product Margins", data: [], loading: false },
    machinePerformance: { title: "Machine Performance", data: [], loading: false },
    productProfitability: { title: "Product Profitability", data: [], loading: false }
  });

  const formatCurrency = (value: any) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const formatPercent = (value: any) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return "0.0%";
    return `${num.toFixed(1)}%`;
  };

  const formatNumber = (value: any) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return "0";
    return num.toLocaleString();
  };

  const runAllReports = async () => {
    setLoading(true);
    try {
      // Run all reports in parallel
      const [inventoryResult, marginsData, machineData, productData] = await Promise.all([
        api.inventoryValuation().catch(e => {
          console.warn('Inventory valuation not available:', e);
          return { total_value: 0, items: [] };
        }),
        api.margins(dateFrom, dateTo).catch(e => {
          console.warn('Margins report not available:', e);
          return [];
        }),
        api.machinePerformance(dateFrom, dateTo).catch(e => {
          console.warn('Machine performance not available:', e);
          return [];
        }),
        api.productProfitability(dateFrom, dateTo).catch(e => {
          console.warn('Product profitability not available:', e);
          return [];
        })
      ]);

      // Handle inventory valuation result which might be an object or array
      const inventoryData = Array.isArray(inventoryResult) 
        ? inventoryResult 
        : inventoryResult?.items || [];

      setReports({
        inventoryValuation: {
          title: "Inventory Valuation",
          data: inventoryData || [],
          loading: false,
          formatters: {
            total_value: formatCurrency,
            unit_cost: formatCurrency,
            unit_price: formatCurrency,
            stock_value: formatCurrency
          }
        },
        margins: {
          title: "Product Margins",
          data: marginsData || [],
          loading: false,
          formatters: {
            gross_revenue_cents: (v: any) => formatCurrency((v || 0) / 100),
            orders: formatNumber,
            qty_sold: formatNumber
          }
        },
        machinePerformance: {
          title: "Machine Performance",
          data: machineData || [],
          loading: false,
          formatters: {
            gross_revenue_cents: (v: any) => formatCurrency((v || 0) / 100),
            cost_cents: (v: any) => formatCurrency((v || 0) / 100),
            net_profit_cents: (v: any) => formatCurrency((v || 0) / 100),
            profit_pct: formatPercent,
            orders: formatNumber,
            qty_sold: formatNumber
          }
        },
        productProfitability: {
          title: "Product Profitability",
          data: productData || [],
          loading: false,
          formatters: {
            gross_revenue_cents: (v: any) => formatCurrency((v || 0) / 100),
            orders: formatNumber,
            qty_sold: formatNumber
          }
        }
      });

      toast.success("All reports generated successfully!");
    } catch (error: any) {
      console.error('Error running reports:', error);
      toast.error(`Failed to generate reports: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (section: ReportSection) => {
    if (section.data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const filename = formatCsvFilename(section.title.toLowerCase().replace(/\s+/g, '_'));
    downloadCsv(filename, section.data);
    toast.success(`${section.title} exported successfully`);
  };

  const ReportTable = ({ section }: { section: ReportSection }) => {
    if (section.data.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No data available for the selected date range.</p>
          <p className="text-sm mt-2">Try running the reports or adjusting the date range.</p>
        </div>
      );
    }

    const headers = section.headers || Object.keys(section.data[0]);
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="font-medium">
                  {header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {section.data.map((row, index) => (
              <TableRow key={index}>
                {headers.map((header) => {
                  const value = row[header];
                  const formatter = section.formatters?.[header];
                  const displayValue = formatter ? formatter(value) : String(value ?? "");
                  
                  return (
                    <TableCell key={header} className="text-sm">
                      {header.includes('pct') && value > 0 ? (
                        <Badge variant={value > 20 ? "default" : value > 10 ? "secondary" : "destructive"}>
                          {displayValue}
                        </Badge>
                      ) : (
                        displayValue
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Profit & Performance Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive business intelligence and profitability analysis
          </p>
        </div>
      </div>

      {/* Date Range and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Report Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <Button onClick={runAllReports} disabled={loading} size="lg">
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {loading ? "Generating..." : "Run All Reports"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="margins" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Margins
          </TabsTrigger>
          <TabsTrigger value="machines" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Machines
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{reports.inventoryValuation.title}</CardTitle>
                {reports.inventoryValuation.data.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportReport(reports.inventoryValuation)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ReportTable section={reports.inventoryValuation} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="margins">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{reports.margins.title}</CardTitle>
                {reports.margins.data.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportReport(reports.margins)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ReportTable section={reports.margins} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="machines">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{reports.machinePerformance.title}</CardTitle>
                {reports.machinePerformance.data.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportReport(reports.machinePerformance)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ReportTable section={reports.machinePerformance} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{reports.productProfitability.title}</CardTitle>
                {reports.productProfitability.data.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportReport(reports.productProfitability)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ReportTable section={reports.productProfitability} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}