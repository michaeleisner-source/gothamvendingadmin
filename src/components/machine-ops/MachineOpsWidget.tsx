import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Wrench,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MachineOpsWidget() {
  const navigate = useNavigate();

  // Mock data for the widget
  const healthSummary = {
    healthy: 12,
    warning: 3,
    critical: 1,
    offline: 0
  };

  const urgentTasks = [
    {
      id: '1',
      machine: 'VM-003',
      issue: 'Cooling System Alert',
      priority: 'urgent',
      risk: 85
    },
    {
      id: '2',
      machine: 'VM-002',
      issue: 'Coin Mechanism Slow',
      priority: 'high',
      risk: 72
    }
  ];

  const overallHealth = 87; // percentage

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Machine Operations</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Health Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Health</span>
            <span className="text-sm font-bold">{overallHealth}%</span>
          </div>
          <Progress value={overallHealth} className="w-full" />
        </div>

        {/* Health Status Summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Healthy: {healthSummary.healthy}</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Warning: {healthSummary.warning}</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm">Critical: {healthSummary.critical}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Offline: {healthSummary.offline}</span>
          </div>
        </div>

        {/* Urgent Maintenance Tasks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Urgent Tasks</span>
            <Badge variant="destructive" className="text-xs">
              {urgentTasks.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {urgentTasks.slice(0, 2).map((task) => (
              <div key={task.id} className="p-2 border rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{task.machine}</span>
                  <Badge 
                    variant={task.priority === 'urgent' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {task.risk}% risk
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{task.issue}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Performance Up 8.2%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            size="sm" 
            className="w-full justify-between"
            onClick={() => navigate('/machine-health-monitor')}
          >
            View Health Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full justify-between"
            onClick={() => navigate('/maintenance-scheduler')}
          >
            <Wrench className="h-4 w-4" />
            Schedule Maintenance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}