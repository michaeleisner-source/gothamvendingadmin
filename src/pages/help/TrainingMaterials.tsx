import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Calendar, Users2, CheckCircle, Target } from 'lucide-react';

const week1Tasks = {
  'Day 1-2': [
    'System overview and navigation',
    'Login procedures and security',
    'Basic data entry and forms',
    'Help system and support contacts'
  ],
  'Day 3-5': [
    'Location and machine management',
    'Inventory tracking and alerts',
    'Basic sales recording',
    'Report generation'
  ]
};

const roleTraining = [
  {
    role: 'Route Operators',
    icon: Users2,
    topics: [
      'Mobile App Usage - Offline functionality, GPS tracking, photo capture',
      'Inventory Management - Restocking procedures, par levels, expiration tracking',
      'Customer Service - Professional interaction, issue resolution, feedback'
    ]
  },
  {
    role: 'Sales Team',
    icon: Target,
    topics: [
      'Prospect Management - Lead qualification, site surveys, proposals',
      'Contract Negotiation - Terms, commission structures, closing techniques'
    ]
  },
  {
    role: 'Office Staff',
    icon: CheckCircle,
    topics: [
      'Administrative Tasks - Data entry, report scheduling, invoice processing',
      'Financial Management - Commission calculations, payment processing, budgets'
    ]
  }
];

export default function TrainingMaterials() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Staff Training Materials</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5" />
            New Employee Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4 text-primary">Week 1: System Basics</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(week1Tasks).map(([period, tasks]) => (
                  <div key={period} className="p-4 rounded-lg bg-muted">
                    <h4 className="font-medium mb-2">{period}: {period.includes('1-2') ? 'Introduction' : 'Core Functions'}</h4>
                    <ul className="space-y-1 text-sm">
                      {tasks.map((task, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-primary">Week 2: Operations Training</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="font-medium mb-2">Daily Operations</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Morning routine checklist</li>
                    <li>• Restocking procedures</li>
                    <li>• Service call handling</li>
                    <li>• End-of-day closeout</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="font-medium mb-2">Customer Management</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Prospect qualification</li>
                    <li>• Site survey procedures</li>
                    <li>• Contract negotiation basics</li>
                    <li>• Relationship maintenance</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-primary">Week 3: Advanced Features</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="font-medium mb-2">Reporting and Analytics</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Financial report generation</li>
                    <li>• Performance analysis</li>
                    <li>• Commission calculations</li>
                    <li>• Data export procedures</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="font-medium mb-2">Troubleshooting</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Common system issues</li>
                    <li>• Machine diagnostic procedures</li>
                    <li>• Inventory discrepancy resolution</li>
                    <li>• Customer complaint handling</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Role-Specific Training
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roleTraining.map((role) => (
              <div key={role.role} className="p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <role.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{role.role}</h3>
                </div>
                <div className="space-y-2">
                  {role.topics.map((topic, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{topic.split(' - ')[0]}:</span>
                      <span className="text-muted-foreground ml-2">{topic.split(' - ')[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Training Assessments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-3">Knowledge Checks</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>System navigation quiz</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Process procedure tests</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Customer scenario exercises</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Safety and compliance review</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Practical Evaluations</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Live system demonstrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Real-world problem solving</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Customer interaction roleplay</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Performance metric achievement</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Ongoing Education
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
              <div>
                <span className="font-medium">Monthly system updates training</span>
                <p className="text-sm text-muted-foreground">Keep staff updated on new features and improvements</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
              <div>
                <span className="font-medium">Quarterly best practices review</span>
                <p className="text-sm text-muted-foreground">Share success stories and optimization techniques</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
              <div>
                <span className="font-medium">Annual compliance certification</span>
                <p className="text-sm text-muted-foreground">Ensure adherence to industry standards and regulations</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
              <div>
                <span className="font-medium">New feature introduction sessions</span>
                <p className="text-sm text-muted-foreground">Comprehensive training on major system updates</p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}