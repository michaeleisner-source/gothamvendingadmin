import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CreditCard, Receipt, Building, Calculator, TrendingUp } from 'lucide-react';
import { HelpTooltip, HelpTooltipProvider } from '@/components/ui/HelpTooltip';
import PaymentProcessors from './PaymentProcessors';
import ProductProfitabilityNet from './reports/ProductProfitabilityNet';

const FinanceManagement = () => {
  return (
    <HelpTooltipProvider>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Finance Management</h1>
        </div>

        <Tabs defaultValue="processors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="processors" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Processors
            </TabsTrigger>
            <TabsTrigger value="commissions" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Commissions
            </TabsTrigger>
            <TabsTrigger value="taxes" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Taxes & Expenses
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Financial Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="processors">
            <PaymentProcessors />
          </TabsContent>

          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Commission Management
                  <HelpTooltip content="Track and calculate commission payments to location partners based on sales performance and agreed rates." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              Pending Commissions
                              <HelpTooltip content="Total commission amount calculated but not yet paid out to location partners." />
                            </p>
                            <p className="text-2xl font-semibold">$0.00</p>
                          </div>
                          <Calculator className="w-8 h-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              Paid This Month
                              <HelpTooltip content="Total commission payments made to location partners in the current month." />
                            </p>
                            <p className="text-2xl font-semibold">$0.00</p>
                          </div>
                          <DollarSign className="w-8 h-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              Commission Rate
                              <HelpTooltip content="Default percentage rate paid to location partners from net sales revenue." />
                            </p>
                            <p className="text-2xl font-semibold">15%</p>
                          </div>
                          <Receipt className="w-8 h-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Commission tracking and calculation features coming soon.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Configure commission rates per location and track payouts.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="taxes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Taxes & Expenses
                  <HelpTooltip content="Manage tax collection, track business expenses, and generate reports for accounting and compliance." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Tax Management Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      Tax Management
                      <HelpTooltip content="Monitor sales tax collection and ensure compliance with local tax regulations." />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                Sales Tax Collected
                                <HelpTooltip content="Total sales tax collected from customers on all sales transactions." />
                              </p>
                              <p className="text-xl font-semibold">$0.00</p>
                            </div>
                            <Building className="w-6 h-6 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                Tax Rate
                                <HelpTooltip content="Current sales tax rate applied to transactions based on location jurisdiction." />
                              </p>
                              <p className="text-xl font-semibold">8.5%</p>
                            </div>
                            <Calculator className="w-6 h-6 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Expense Management Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      Expense Tracking
                      <HelpTooltip content="Track all business expenses including equipment, maintenance, supplies, and operational costs." />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                Monthly Expenses
                                <HelpTooltip content="Total operating expenses for the current month including supplies, maintenance, and services." />
                              </p>
                              <p className="text-xl font-semibold">$0.00</p>
                            </div>
                            <Receipt className="w-6 h-6 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                Equipment Costs
                                <HelpTooltip content="Expenses related to vending machine purchases, leasing, and major equipment investments." />
                              </p>
                              <p className="text-xl font-semibold">$0.00</p>
                            </div>
                            <DollarSign className="w-6 h-6 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                Operating Costs
                                <HelpTooltip content="Day-to-day operational expenses including utilities, transportation, insurance, and administrative costs." />
                              </p>
                              <p className="text-xl font-semibold">$0.00</p>
                            </div>
                            <Building className="w-6 h-6 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Tax and expense management features coming soon.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Track tax obligations, manage expenses, and generate tax reports.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Financial Analysis
                  <HelpTooltip content="Comprehensive financial performance analysis including revenue, profit margins, ROI, and cash flow insights." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              Gross Revenue
                              <HelpTooltip content="Total revenue from all sales before deducting any costs, fees, or expenses." />
                            </p>
                            <p className="text-2xl font-semibold">$0.00</p>
                          </div>
                          <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              Net Profit
                              <HelpTooltip content="Final profit after deducting all costs, fees, commissions, and expenses from gross revenue." />
                            </p>
                            <p className="text-2xl font-semibold">$0.00</p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              Profit Margin
                              <HelpTooltip content="Net profit as a percentage of gross revenue. Higher percentages indicate better profitability." />
                            </p>
                            <p className="text-2xl font-semibold">0%</p>
                          </div>
                          <Calculator className="w-8 h-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              ROI
                              <HelpTooltip content="Return on Investment - measures the efficiency of your vending business investment relative to initial costs." />
                            </p>
                            <p className="text-2xl font-semibold">0%</p>
                          </div>
                          <Receipt className="w-8 h-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <ProductProfitabilityNet />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </HelpTooltipProvider>
  );
};

export default FinanceManagement;