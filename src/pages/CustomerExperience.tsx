import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Heart, MessageSquare, BarChart3 } from 'lucide-react';
import { EnhancedCustomerAnalytics } from '@/components/customers/EnhancedCustomerAnalytics';
import { CustomerLoyaltyProgram } from '@/components/customers/CustomerLoyaltyProgram';
import { CustomerFeedbackSystem } from '@/components/customers/CustomerFeedbackSystem';

export default function CustomerExperience() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Customer Experience</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive customer analytics, loyalty programs, and feedback management
        </p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Customer Analytics
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Loyalty Program
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <EnhancedCustomerAnalytics />
        </TabsContent>

        <TabsContent value="loyalty">
          <CustomerLoyaltyProgram />
        </TabsContent>

        <TabsContent value="feedback">
          <CustomerFeedbackSystem />
        </TabsContent>
      </Tabs>
    </div>
  );
}