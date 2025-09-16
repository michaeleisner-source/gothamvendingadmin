import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Calendar, AlertCircle, CheckCircle, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Header } from '@/components/ui/Header';
import { useToast } from '@/hooks/use-toast';

interface BillingInfo {
  plan: {
    name: string;
    price_monthly: number;
    features: string[];
    limits: {
      machines: number;
      locations: number;
      users: number;
      api_calls: number;
    };
  };
  usage: {
    machines: number;
    locations: number;
    users: number;
    api_calls: number;
  };
  subscription: {
    status: 'active' | 'past_due' | 'canceled' | 'trial';
    current_period_end: string;
    next_billing_date: string;
    auto_renew: boolean;
    trial_ends: string | null;
  };
  payment_method: {
    type: 'card';
    last4: string;
    brand: string;
    exp_month: number;
    exp_year: number;
  } | null;
}

interface Invoice {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  pdf_url: string;
  description: string;
}

const AdminBilling = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    // Mock data - replace with actual Supabase/Stripe integration
    const mockBillingInfo: BillingInfo = {
      plan: {
        name: 'Professional',
        price_monthly: 99,
        features: [
          'Up to 50 machines',
          'Unlimited locations',
          '10 team members',
          'Advanced reporting',
          'API access',
          'Priority support'
        ],
        limits: {
          machines: 50,
          locations: -1, // unlimited
          users: 10,
          api_calls: 10000
        }
      },
      usage: {
        machines: 12,
        locations: 8,
        users: 4,
        api_calls: 2580
      },
      subscription: {
        status: 'active',
        current_period_end: '2024-04-15T00:00:00Z',
        next_billing_date: '2024-04-15T00:00:00Z',
        auto_renew: true,
        trial_ends: null
      },
      payment_method: {
        type: 'card',
        last4: '4242',
        brand: 'visa',
        exp_month: 12,
        exp_year: 2025
      }
    };

    const mockInvoices: Invoice[] = [
      {
        id: 'inv_001',
        amount: 99,
        status: 'paid',
        date: '2024-03-15T00:00:00Z',
        pdf_url: '#',
        description: 'Professional Plan - March 2024'
      },
      {
        id: 'inv_002',
        amount: 99,
        status: 'paid',
        date: '2024-02-15T00:00:00Z',
        pdf_url: '#',
        description: 'Professional Plan - February 2024'
      },
      {
        id: 'inv_003',
        amount: 99,
        status: 'paid',
        date: '2024-01-15T00:00:00Z',
        pdf_url: '#',
        description: 'Professional Plan - January 2024'
      }
    ];

    setTimeout(() => {
      setBillingInfo(mockBillingInfo);
      setInvoices(mockInvoices);
      setLoading(false);
    }, 1000);
  }, []);

  const handleUpdatePaymentMethod = () => {
    toast({
      title: "Update Payment Method",
      description: "Payment method update feature coming soon",
    });
  };

  const handleChangePlan = () => {
    toast({
      title: "Change Plan",
      description: "Plan change feature coming soon",
    });
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: "Download Invoice",
      description: "Invoice download feature coming soon",
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'past_due': return 'bg-red-100 text-red-800';
      case 'canceled': return 'bg-gray-100 text-gray-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getUsagePercentage = (usage: number, limit: number) => {
    if (limit === -1) return 0; // unlimited
    return Math.min((usage / limit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="h-48 bg-muted rounded"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!billingInfo) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Unable to load billing information</h3>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Header 
        title="Billing & Subscriptions" 
        subtitle="Manage your subscription, billing details, and payment methods" 
      />

      {/* Subscription Status Alert */}
      {billingInfo.subscription.status === 'past_due' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Issue</AlertTitle>
          <AlertDescription>
            Your payment is past due. Please update your payment method to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      {billingInfo.subscription.trial_ends && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Trial Ending Soon</AlertTitle>
          <AlertDescription>
            Your trial ends on {new Date(billingInfo.subscription.trial_ends).toLocaleDateString()}. 
            Add a payment method to continue using our services.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{billingInfo.plan.name}</h3>
                <p className="text-muted-foreground">
                  {formatCurrency(billingInfo.plan.price_monthly)}/month
                </p>
              </div>
              <Badge className={getStatusBadgeColor(billingInfo.subscription.status)}>
                {billingInfo.subscription.status.charAt(0).toUpperCase() + billingInfo.subscription.status.slice(1)}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Next billing date</span>
                <span>{new Date(billingInfo.subscription.next_billing_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Auto-renewal</span>
                <span>{billingInfo.subscription.auto_renew ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Plan Features</h4>
              <ul className="text-sm space-y-1">
                {billingInfo.plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <Button onClick={handleChangePlan} className="w-full">
              Change Plan
            </Button>
          </CardContent>
        </Card>

        {/* Usage & Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Usage & Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Machines</span>
                  <span>{billingInfo.usage.machines} / {billingInfo.plan.limits.machines === -1 ? '∞' : billingInfo.plan.limits.machines}</span>
                </div>
                <Progress value={getUsagePercentage(billingInfo.usage.machines, billingInfo.plan.limits.machines)} />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Locations</span>
                  <span>{billingInfo.usage.locations} / {billingInfo.plan.limits.locations === -1 ? '∞' : billingInfo.plan.limits.locations}</span>
                </div>
                <Progress value={getUsagePercentage(billingInfo.usage.locations, billingInfo.plan.limits.locations)} />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Team Members</span>
                  <span>{billingInfo.usage.users} / {billingInfo.plan.limits.users}</span>
                </div>
                <Progress value={getUsagePercentage(billingInfo.usage.users, billingInfo.plan.limits.users)} />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>API Calls (this month)</span>
                  <span>{billingInfo.usage.api_calls.toLocaleString()} / {billingInfo.plan.limits.api_calls.toLocaleString()}</span>
                </div>
                <Progress value={getUsagePercentage(billingInfo.usage.api_calls, billingInfo.plan.limits.api_calls)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billingInfo.payment_method ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">
                    {billingInfo.payment_method.brand.toUpperCase()} ending in {billingInfo.payment_method.last4}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires {billingInfo.payment_method.exp_month}/{billingInfo.payment_method.exp_year}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleUpdatePaymentMethod}>
                Update
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No payment method</h3>
              <p className="text-muted-foreground mb-4">Add a payment method to continue using our services</p>
              <Button onClick={handleUpdatePaymentMethod}>
                Add Payment Method
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    {new Date(invoice.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownloadInvoice(invoice.id)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {invoices.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No billing history</h3>
              <p className="text-muted-foreground">Your invoices will appear here once billing begins</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBilling;