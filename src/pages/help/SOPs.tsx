import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Clock, Calendar, RefreshCw } from 'lucide-react';

const dailyTasks = [
  'Check Dashboard - Review overnight alerts and metrics',
  'Monitor Machine Health - Address any offline machines',
  'Review Low Stock Alerts - Plan restocking routes',
  'Check Commission Reports - Verify location performance',
  'Process New Prospects - Follow up on leads',
  'Record Sales - Enter manual transactions if needed',
  'Update Inventory - Log restocking activities',
  'Handle Service Calls - Address machine issues promptly',
  'Monitor Finances - Track daily revenue vs. targets',
  'Manage Routes - Optimize delivery schedules',
  'Generate Reports - Daily sales and performance summary',
  'Plan Tomorrow - Schedule restocking and maintenance',
  'Update Contracts - Process any signed agreements',
  'Backup Data - Ensure all information is saved',
  'Review Metrics - Analyze performance against goals'
];

const weeklyTasks = {
  Monday: [
    'Review weekly targets',
    'Schedule route optimization',
    'Plan new prospect visits',
    'Process commission statements'
  ],
  Wednesday: [
    'Analyze performance trends',
    'Adjust inventory levels',
    'Review machine health reports',
    'Update pricing strategies'
  ],
  Friday: [
    'Generate weekly reports',
    'Process payments and invoices',
    'Plan weekend maintenance',
    'Prepare for next week'
  ]
};

const monthlyTasks = [
  'Generate commission statements',
  'Review contract renewals',
  'Analyze location performance',
  'Plan equipment purchases',
  'Conduct financial reconciliation'
];

export default function SOPs() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <CheckSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Standard Operating Procedures</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daily Operations Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-semibold mb-3 text-primary">Morning (Start of Day)</h3>
              <ul className="space-y-2">
                {dailyTasks.slice(0, 5).map((task, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 text-primary">During the Day</h3>
              <ul className="space-y-2">
                {dailyTasks.slice(5, 10).map((task, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 text-primary">End of Day</h3>
              <ul className="space-y-2">
                {dailyTasks.slice(10).map((task, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Procedures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {Object.entries(weeklyTasks).map(([day, tasks]) => (
              <div key={day}>
                <h3 className="font-semibold mb-3 text-primary">{day}: {day === 'Monday' ? 'Planning Week' : day === 'Wednesday' ? 'Mid-Week Review' : 'Week Closure'}</h3>
                <ul className="space-y-2">
                  {tasks.map((task, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Monthly Procedures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {monthlyTasks.map((task, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{task}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}