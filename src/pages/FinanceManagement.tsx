import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CreditCard, Receipt, Building, Calculator, TrendingUp } from 'lucide-react';
import PaymentProcessors from './PaymentProcessors';

const FinanceManagement = () => {
  return (
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Pending Commissions</p>
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
                          <p className="text-sm text-muted-foreground">Paid This Month</p>
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
                          <p className="text-sm text-muted-foreground">Commission Rate</p>
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Tax Management Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Tax Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Sales Tax Collected</p>
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
                            <p className="text-sm text-muted-foreground">Tax Rate</p>
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
                  <h3 className="text-lg font-semibold mb-4">Expense Tracking</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Monthly Expenses</p>
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
                            <p className="text-sm text-muted-foreground">Equipment Costs</p>
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
                            <p className="text-sm text-muted-foreground">Operating Costs</p>
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Gross Revenue</p>
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
                          <p className="text-sm text-muted-foreground">Net Profit</p>
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
                          <p className="text-sm text-muted-foreground">Profit Margin</p>
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
                          <p className="text-sm text-muted-foreground">ROI</p>
                          <p className="text-2xl font-semibold">0%</p>
                        </div>
                        <Receipt className="w-8 h-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center py-8">
                  <p className="text-muted-foreground">Advanced financial analysis features coming soon.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Detailed profit analysis, cash flow reports, and ROI calculations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceManagement;