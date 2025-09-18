import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign,
  Calendar,
  Users,
  MapPin,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  FileText,
  Send
} from 'lucide-react';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';

interface CommissionRule {
  id: string;
  location_id: string;
  location_name: string;
  commission_type: 'percentage' | 'tiered' | 'flat';
  rate: number;
  tiers?: Array<{
    min_revenue: number;
    max_revenue?: number;
    rate: number;
  }>;
  base_calculation: 'gross_sales' | 'net_sales' | 'profit';
  minimum_guarantee: number;
  effective_from: string;
  effective_to?: string;
  status: 'active' | 'pending' | 'expired';
}

interface CommissionCalculation {
  location_id: string;
  location_name: string;
  period: string;
  gross_sales: number;
  net_sales: number;
  commission_base: number;
  commission_rate: number;
  commission_amount: number;
  minimum_guarantee: number;
  final_commission: number;
  status: 'calculated' | 'approved' | 'paid';
  payment_date?: string;
}

export function CommissionAutomation() {
  // Mock commission rules
  const commissionRules: CommissionRule[] = [
    {
      id: '1',
      location_id: 'loc-1',
      location_name: 'Downtown Office Complex',
      commission_type: 'percentage',
      rate: 15,
      base_calculation: 'net_sales',
      minimum_guarantee: 200,
      effective_from: '2024-01-01',
      status: 'active'
    },
    {
      id: '2',
      location_id: 'loc-2',
      location_name: 'University Campus',
      commission_type: 'tiered',
      rate: 0,
      tiers: [
        { min_revenue: 0, max_revenue: 1000, rate: 10 },
        { min_revenue: 1001, max_revenue: 2000, rate: 12 },
        { min_revenue: 2001, rate: 15 }
      ],
      base_calculation: 'gross_sales',
      minimum_guarantee: 150,
      effective_from: '2024-01-01',
      status: 'active'
    },
    {
      id: '3',
      location_id: 'loc-3',
      location_name: 'Hospital Lobby',
      commission_type: 'flat',
      rate: 300,
      base_calculation: 'gross_sales',
      minimum_guarantee: 0,
      effective_from: '2024-01-01',
      status: 'active'
    }
  ];

  // Mock commission calculations
  const commissionCalculations: CommissionCalculation[] = [
    {
      location_id: 'loc-1',
      location_name: 'Downtown Office Complex',
      period: 'November 2024',
      gross_sales: 2500,
      net_sales: 2200,
      commission_base: 2200,
      commission_rate: 15,
      commission_amount: 330,
      minimum_guarantee: 200,
      final_commission: 330,
      status: 'calculated'
    },
    {
      location_id: 'loc-2',
      location_name: 'University Campus',
      period: 'November 2024',
      gross_sales: 1800,
      net_sales: 1650,
      commission_base: 1800,
      commission_rate: 12,
      commission_amount: 216,
      minimum_guarantee: 150,
      final_commission: 216,
      status: 'approved'
    },
    {
      location_id: 'loc-3',
      location_name: 'Hospital Lobby',
      period: 'November 2024',
      gross_sales: 1200,
      net_sales: 1100,
      commission_base: 1200,
      commission_rate: 0,
      commission_amount: 300,
      minimum_guarantee: 0,
      final_commission: 300,
      status: 'paid',
      payment_date: '2024-12-01'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'expired': return 'destructive';
      case 'calculated': return 'secondary';
      case 'approved': return 'default';
      case 'paid': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'pending': return AlertTriangle;
      case 'calculated': return Settings;
      case 'approved': return Play;
      case 'paid': return CheckCircle;
      default: return Settings;
    }
  };

  const calculateTieredCommission = (amount: number, tiers: Array<{min_revenue: number; max_revenue?: number; rate: number}>) => {
    let commission = 0;
    let remaining = amount;

    for (const tier of tiers) {
      const tierMax = tier.max_revenue || Infinity;
      const tierAmount = Math.min(remaining, tierMax - tier.min_revenue);
      
      if (tierAmount > 0) {
        commission += (tierAmount * tier.rate) / 100;
        remaining -= tierAmount;
      }
      
      if (remaining <= 0) break;
    }

    return commission;
  };

  const totalCommissionsCalculated = commissionCalculations.reduce((sum, calc) => sum + calc.final_commission, 0);
  const totalCommissionsPaid = commissionCalculations
    .filter(calc => calc.status === 'paid')
    .reduce((sum, calc) => sum + calc.final_commission, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Commission Automation</h2>
          <p className="text-muted-foreground">Automated commission calculations and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure Rules
          </Button>
          <Button size="sm">
            <Play className="h-4 w-4 mr-2" />
            Run Calculations
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Active Locations</p>
              <div className="text-2xl font-bold">{commissionRules.filter(r => r.status === 'active').length}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Commissions</p>
              <div className="text-2xl font-bold">{formatCurrency(totalCommissionsCalculated)}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Paid This Month</p>
              <div className="text-2xl font-bold">{formatCurrency(totalCommissionsPaid)}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Avg Commission Rate</p>
              <div className="text-2xl font-bold">13.2%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calculations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calculations">Current Calculations</TabsTrigger>
          <TabsTrigger value="rules">Commission Rules</TabsTrigger>
          <TabsTrigger value="automation">Automation Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="calculations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>November 2024 Commission Calculations</CardTitle>
              <div className="text-sm text-muted-foreground">
                Automated calculations ready for review and approval
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commissionCalculations.map((calc) => (
                  <div key={calc.location_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-semibold">{calc.location_name}</h4>
                          <p className="text-sm text-muted-foreground">{calc.period}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(calc.status)}>
                          {React.createElement(getStatusIcon(calc.status), { className: "h-3 w-3 mr-1" })}
                          {calc.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Gross Sales</div>
                        <div className="font-semibold">{formatCurrency(calc.gross_sales)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Commission Base</div>
                        <div className="font-semibold">{formatCurrency(calc.commission_base)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Rate Applied</div>
                        <div className="font-semibold">{calc.commission_rate > 0 ? `${calc.commission_rate}%` : 'Flat Rate'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Final Commission</div>
                        <div className="font-bold text-green-600">{formatCurrency(calc.final_commission)}</div>
                      </div>
                    </div>

                    {calc.minimum_guarantee > 0 && calc.commission_amount < calc.minimum_guarantee && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                        <div className="flex items-center text-yellow-800">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            Minimum guarantee applied: {formatCurrency(calc.minimum_guarantee)} 
                            (calculated: {formatCurrency(calc.commission_amount)})
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      {calc.status === 'calculated' && (
                        <>
                          <Button size="sm" variant="outline">
                            <FileText className="h-4 w-4 mr-2" />
                            Review Details
                          </Button>
                          <Button size="sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        </>
                      )}
                      {calc.status === 'approved' && (
                        <Button size="sm">
                          <Send className="h-4 w-4 mr-2" />
                          Process Payment
                        </Button>
                      )}
                      {calc.status === 'paid' && (
                        <div className="text-sm text-muted-foreground">
                          Paid on {calc.payment_date}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission Rules Configuration</CardTitle>
              <div className="text-sm text-muted-foreground">
                Define commission structures for each location
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commissionRules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-semibold">{rule.location_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Effective from {new Date(rule.effective_from).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(rule.status)}>
                        {rule.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Commission Type</div>
                        <div className="font-semibold capitalize">{rule.commission_type}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Base Calculation</div>
                        <div className="font-semibold">{rule.base_calculation.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Rate/Amount</div>
                        <div className="font-semibold">
                          {rule.commission_type === 'percentage' 
                            ? `${rule.rate}%`
                            : rule.commission_type === 'flat'
                            ? formatCurrency(rule.rate)
                            : 'Tiered'
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Min Guarantee</div>
                        <div className="font-semibold">{formatCurrency(rule.minimum_guarantee)}</div>
                      </div>
                    </div>

                    {rule.commission_type === 'tiered' && rule.tiers && (
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm font-medium mb-2">Tier Structure:</div>
                        <div className="space-y-1">
                          {rule.tiers.map((tier, index) => (
                            <div key={index} className="text-sm flex justify-between">
                              <span>
                                {formatCurrency(tier.min_revenue)} - {tier.max_revenue ? formatCurrency(tier.max_revenue) : 'Above'}
                              </span>
                              <span className="font-medium">{tier.rate}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 mt-3">
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Rule
                      </Button>
                      <Button size="sm" variant="outline">
                        View History
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Automation Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Monthly Calculations</div>
                    <div className="text-sm text-muted-foreground">Run on the 1st of each month</div>
                  </div>
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Payment Processing</div>
                    <div className="text-sm text-muted-foreground">Auto-process approved payments</div>
                  </div>
                  <Badge variant="secondary">
                    <Pause className="h-3 w-3 mr-1" />
                    Manual
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">Send statements automatically</div>
                  </div>
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Calculations Complete</span>
                    <span>100%</span>
                  </div>
                  <Progress value={100} className="w-full" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Approvals Pending</span>
                    <span>33%</span>
                  </div>
                  <Progress value={33} className="w-full" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Payments Processed</span>
                    <span>33%</span>
                  </div>
                  <Progress value={33} className="w-full" />
                </div>

                <div className="pt-3 border-t">
                  <div className="text-sm font-medium mb-2">Next Scheduled Run:</div>
                  <div className="text-sm text-muted-foreground">
                    December 1, 2024 at 12:00 AM
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">November calculations completed</div>
                      <div className="text-sm text-muted-foreground">3 locations processed</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">Dec 1, 2024 12:05 AM</div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <Send className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Commission statements sent</div>
                      <div className="text-sm text-muted-foreground">Hospital Lobby payment processed</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">Dec 1, 2024 12:10 AM</div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5 text-orange-500" />
                    <div>
                      <div className="font-medium">Rule updated</div>
                      <div className="text-sm text-muted-foreground">University Campus tier structure modified</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">Nov 28, 2024 3:45 PM</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}