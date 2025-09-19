import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Bot, 
  Settings, 
  TrendingUp, 
  Package, 
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Zap
} from 'lucide-react';

interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

const mockRules: OptimizationRule[] = [
  {
    id: '1',
    name: 'Smart Reorder Points',
    description: 'Automatically adjust reorder points based on demand patterns',
    enabled: true,
    confidence: 94,
    impact: 'high'
  },
  {
    id: '2',
    name: 'Seasonal Adjustments',
    description: 'Modify inventory levels for seasonal demand changes',
    enabled: true,
    confidence: 87,
    impact: 'high'
  },
  {
    id: '3',
    name: 'Weather-Based Ordering',
    description: 'Adjust cold drink orders based on weather forecasts',
    enabled: false,
    confidence: 76,
    impact: 'medium'
  },
  {
    id: '4',
    name: 'Event-Driven Stocking',
    description: 'Increase stock before predicted high-traffic events',
    enabled: true,
    confidence: 82,
    impact: 'medium'
  }
];

export function PredictiveInventoryOptimizer() {
  const [rules, setRules] = useState(mockRules);
  const [aiAggressiveness, setAiAggressiveness] = useState([75]);
  const [autoApproveThreshold, setAutoApproveThreshold] = useState([90]);

  const toggleRule = (id: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const getImpactBadge = (impact: string) => {
    const variants = {
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    } as const;
    return <Badge variant={variants[impact as keyof typeof variants]}>{impact.toUpperCase()}</Badge>;
  };

  const pendingActions = [
    {
      id: '1',
      type: 'reorder',
      description: 'Reorder 50 Coca-Cola 20oz (Stock: 12, Predicted demand: 85)',
      confidence: 94,
      savings: '$127',
      urgent: true
    },
    {
      id: '2',
      type: 'reduce',
      description: 'Reduce Red Bull order from 40 to 25 units (Low demand forecast)',
      confidence: 89,
      savings: '$45',
      urgent: false
    },
    {
      id: '3',
      type: 'seasonal',
      description: 'Increase hot beverage stock by 30% (Temperature dropping)',
      confidence: 78,
      savings: '$89',
      urgent: false
    }
  ];

  const optimizationStats = {
    totalSavings: '$2,847',
    accuracyRate: '91%',
    actionsThisMonth: 47,
    autoApproved: 39
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Predictive Inventory Optimizer</h3>
          <p className="text-muted-foreground">AI-driven automation for optimal stock management</p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Configure AI Model
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{optimizationStats.totalSavings}</div>
                <div className="text-xs text-muted-foreground">Monthly Savings</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{optimizationStats.accuracyRate}</div>
                <div className="text-xs text-muted-foreground">Prediction Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{optimizationStats.actionsThisMonth}</div>
                <div className="text-xs text-muted-foreground">Actions This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{optimizationStats.autoApproved}</div>
                <div className="text-xs text-muted-foreground">Auto-Approved</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Aggressiveness</label>
              <div className="px-3">
                <Slider
                  value={aiAggressiveness}
                  onValueChange={setAiAggressiveness}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Conservative</span>
                <span>{aiAggressiveness[0]}%</span>
                <span>Aggressive</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Auto-Approve Threshold</label>
              <div className="px-3">
                <Slider
                  value={autoApproveThreshold}
                  onValueChange={setAutoApproveThreshold}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Manual Review</span>
                <span>{autoApproveThreshold[0]}% confidence</span>
                <span>Full Auto</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending AI Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingActions.map((action) => (
                <div key={action.id} className={`p-3 border rounded-lg ${action.urgent ? 'border-orange-200 bg-orange-50' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {action.urgent ? (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-blue-600" />
                      )}
                      <span className="text-xs font-medium">
                        {action.confidence}% CONFIDENCE
                      </span>
                    </div>
                    <div className="text-sm font-medium text-green-600">{action.savings}</div>
                  </div>
                  <p className="text-sm mb-3">{action.description}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline">Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                  <div>
                    <div className="font-medium">{rule.name}</div>
                    <div className="text-sm text-muted-foreground">{rule.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getImpactBadge(rule.impact)}
                  <div className="text-right">
                    <div className="text-sm font-medium">{rule.confidence}%</div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Machine Learning Insights */}
      <Card>
        <CardHeader>
          <CardTitle>ML Model Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <Package className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold">156</div>
              <div className="text-sm text-muted-foreground">Products Analyzed</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold">91%</div>
              <div className="text-sm text-muted-foreground">Demand Accuracy</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Bot className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-muted-foreground">Continuous Learning</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}