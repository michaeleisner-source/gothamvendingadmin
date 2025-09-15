import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Filter, 
  Eye, 
  AlertTriangle, 
  Package2, 
  CheckCircle, 
  ArrowRight,
  MapPin,
  BarChart3
} from 'lucide-react';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'completed' | 'active' | 'pending';
  action?: string;
}

interface InventoryWorkflowProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  totalItems: number;
  filteredItems: number;
  alertItems: number;
}

export function InventoryWorkflow({ 
  currentStep, 
  onStepChange, 
  totalItems, 
  filteredItems, 
  alertItems 
}: InventoryWorkflowProps) {
  const steps: WorkflowStep[] = [
    {
      id: 1,
      title: 'Filter & Search',
      description: 'Find specific inventory items by machine, status, or product',
      icon: Search,
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'active' : 'pending',
      action: 'Set filters'
    },
    {
      id: 2,
      title: 'Analyze Status',
      description: 'Review stock levels and identify items needing attention',
      icon: BarChart3,
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'active' : 'pending',
      action: 'Check levels'
    },
    {
      id: 3,
      title: 'Identify Alerts',
      description: 'Focus on low stock and out-of-stock items requiring immediate action',
      icon: AlertTriangle,
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'active' : 'pending',
      action: 'Review alerts'
    },
    {
      id: 4,
      title: 'Plan Actions',
      description: 'Create restock schedules and maintenance plans based on data',
      icon: Package2,
      status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'active' : 'pending',
      action: 'Schedule restocks'
    }
  ];

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'active': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-400 bg-gray-50 border-gray-200';
    }
  };

  const getIconColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'active': return 'text-blue-600';
      default: return 'text-gray-400';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Inventory Management Workflow
        </CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total Items: <strong>{totalItems}</strong></span>
          <span>Filtered: <strong>{filteredItems}</strong></span>
          <span>Alerts: <strong className="text-orange-600">{alertItems}</strong></span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="mb-6">
            <Progress value={(currentStep / steps.length) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {currentStep} of {steps.length} - {steps[currentStep - 1]?.title}
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${getStepColor(step.status)}`}
                  onClick={() => onStepChange(step.id)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-full ${step.status === 'completed' ? 'bg-green-100' : step.status === 'active' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {step.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <step.icon className={`h-5 w-5 ${getIconColor(step.status)}`} />
                      )}
                    </div>
                    <Badge variant={step.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      Step {step.id}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                  
                  {step.action && (
                    <Button 
                      variant={step.status === 'active' ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full text-xs"
                    >
                      {step.action}
                    </Button>
                  )}
                </div>
                
                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Current Step Details */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Current Focus: {steps[currentStep - 1]?.title}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              {steps[currentStep - 1]?.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function InventoryActionGuide({ currentStep }: { currentStep: number }) {
  const actionGuides = {
    1: {
      title: 'Step 1: Filter & Search Your Inventory',
      tips: [
        'Use the machine filter to focus on specific locations',
        'Filter by stock status to prioritize critical items',
        'Search by product name, SKU, or machine name for quick access',
        'Combine filters to narrow down results effectively'
      ],
      nextAction: 'Once filtered, proceed to analyze stock levels'
    },
    2: {
      title: 'Step 2: Analyze Stock Levels',
      tips: [
        'Review current quantities vs. PAR levels',
        'Check days of supply for each item',
        'Identify items approaching reorder points',
        'Note sales velocity patterns for better forecasting'
      ],
      nextAction: 'Focus on items with low stock or alerts'
    },
    3: {
      title: 'Step 3: Review Stock Alerts',
      tips: [
        'Prioritize out-of-stock items for immediate action',
        'Schedule restocks for low-stock items within 2-3 days',
        'Check if slow-moving items need PAR level adjustments',
        'Verify reorder points are appropriate for sales velocity'
      ],
      nextAction: 'Create action plans for identified issues'
    },
    4: {
      title: 'Step 4: Plan & Execute Actions',
      tips: [
        'Create restock schedules based on urgency and supply lead times',
        'Coordinate with suppliers for bulk orders when possible',
        'Update PAR levels and reorder points as needed',
        'Set follow-up reminders for critical items'
      ],
      nextAction: 'Monitor results and adjust plans as needed'
    }
  };

  const guide = actionGuides[currentStep as keyof typeof actionGuides];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          {guide.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {guide.tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm">{tip}</p>
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Next: {guide.nextAction}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}