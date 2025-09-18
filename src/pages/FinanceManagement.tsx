import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, TrendingUp, Calculator } from 'lucide-react';
import { ProfitLossStatement } from '@/components/finance/ProfitLossStatement';
import { CashFlowAnalysis } from '@/components/finance/CashFlowAnalysis';
import { CommissionAutomation } from '@/components/finance/CommissionAutomation';

export default function FinanceManagement() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive financial analysis, cash flow management, and automated commission processing
        </p>
      </div>

      <Tabs defaultValue="profit-loss" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profit-loss" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            P&L Statement
          </TabsTrigger>
          <TabsTrigger value="cash-flow" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Cash Flow Analysis
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Commission Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss">
          <ProfitLossStatement />
        </TabsContent>

        <TabsContent value="cash-flow">
          <CashFlowAnalysis />
        </TabsContent>

        <TabsContent value="commissions">
          <CommissionAutomation />
        </TabsContent>
      </Tabs>
    </div>
  );
}