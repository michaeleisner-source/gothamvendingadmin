import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  Wrench,
  BarChart3,
  Target
} from 'lucide-react';

interface MaintenanceTask {
  id: string;
  machineId: string;
  machineName: string;
  location: string;
  taskType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  predictedFailure: number; // percentage risk
  estimatedDate: string;
  estimatedCost: number;
  estimatedDuration: number; // minutes
  description: string;
  preventiveActions: string[];
}

export function PredictiveMaintenance() {
  const maintenanceTasks: MaintenanceTask[] = [
    {
      id: '1',
      machineId: 'VM-003',
      machineName: 'VM-003',
      location: 'University Campus',
      taskType: 'Cooling System Service',
      priority: 'urgent',
      predictedFailure: 85,
      estimatedDate: '2024-02-15',
      estimatedCost: 150,
      estimatedDuration: 120,
      description: 'Cooling system showing signs of stress. Temperature readings consistently above normal.',
      preventiveActions: ['Clean condenser coils', 'Replace air filter', 'Check refrigerant levels']
    },
    {
      id: '2',
      machineId: 'VM-002',
      machineName: 'VM-002',
      location: 'Hospital Lobby',
      taskType: 'Coin Mechanism Maintenance',
      priority: 'high',
      predictedFailure: 72,
      estimatedDate: '2024-02-20',
      estimatedCost: 85,
      estimatedDuration: 60,
      description: 'Coin acceptance rate declining. Mechanism likely needs cleaning and calibration.',
      preventiveActions: ['Clean coin paths', 'Calibrate sensors', 'Lubricate moving parts']
    },
    {
      id: '3',
      machineId: 'VM-001',
      machineName: 'VM-001',
      location: 'Downtown Office',
      taskType: 'Routine Inspection',
      priority: 'medium',
      predictedFailure: 35,
      estimatedDate: '2024-03-01',
      estimatedCost: 60,
      estimatedDuration: 45,
      description: 'Scheduled preventive maintenance to ensure optimal performance.',
      preventiveActions: ['General inspection', 'Clean exterior', 'Test all functions']
    },
    {
      id: '4',
      machineId: 'VM-004',
      machineName: 'VM-004',
      location: 'Shopping Mall',
      taskType: 'Display Screen Replacement',
      priority: 'low',
      predictedFailure: 45,
      estimatedDate: '2024-03-10',
      estimatedCost: 200,
      estimatedDuration: 90,
      description: 'Display brightness decreasing. Predicted failure within 30 days.',
      preventiveActions: ['Order replacement screen', 'Schedule installation', 'Backup display settings']
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const totalTasks = maintenanceTasks.length;
  const urgentTasks = maintenanceTasks.filter(t => t.priority === 'urgent').length;
  const highTasks = maintenanceTasks.filter(t => t.priority === 'high').length;
  const totalCost = maintenanceTasks.reduce((sum, task) => sum + task.estimatedCost, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Wrench className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
              <div className="text-2xl font-bold">{totalTasks}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Urgent</p>
              <div className="text-2xl font-bold">{urgentTasks}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">High Priority</p>
              <div className="text-2xl font-bold">{highTasks}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Target className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Est. Cost</p>
              <div className="text-2xl font-bold">${totalCost}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Predicted Maintenance Tasks</h3>
          <Button size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
        
        {maintenanceTasks.map((task) => (
          <Card key={task.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge 
                    className={`${getPriorityColor(task.priority)} text-white flex items-center gap-1`}
                  >
                    {getPriorityIcon(task.priority)}
                    {task.priority.toUpperCase()}
                  </Badge>
                  <div>
                    <CardTitle className="text-lg">{task.taskType}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {task.machineName} • {task.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    ${task.estimatedCost} • {task.estimatedDuration}min
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(task.estimatedDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Failure Risk</span>
                    <span className="text-sm font-bold text-red-600">
                      {task.predictedFailure}%
                    </span>
                  </div>
                  <Progress value={task.predictedFailure} className="w-full" />
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {task.description}
                  </p>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-2">Preventive Actions:</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {task.preventiveActions.map((action, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">
                    Schedule Service
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}