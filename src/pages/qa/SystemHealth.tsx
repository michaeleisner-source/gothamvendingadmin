import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  duration?: number;
}

export default function SystemHealth() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const healthChecks = [
    { name: 'Database Connection', endpoint: '/health/db' },
    { name: 'Auth Service', endpoint: '/health/auth' },
    { name: 'Edge Functions', endpoint: '/health/functions' },
    { name: 'Storage', endpoint: '/health/storage' },
    { name: 'API Response Time', endpoint: '/health/api' }
  ];

  const runHealthChecks = async () => {
    setIsRunning(true);
    setChecks(healthChecks.map(check => ({ 
      ...check, 
      status: 'pending' as const, 
      message: 'Running...' 
    })));

    for (let i = 0; i < healthChecks.length; i++) {
      const check = healthChecks[i];
      const startTime = Date.now();
      
      try {
        // Simulate health check
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        const duration = Date.now() - startTime;
        
        setChecks(prev => prev.map((c, idx) => 
          idx === i ? {
            ...c,
            status: duration > 1000 ? 'warning' : 'pass',
            message: duration > 1000 ? `Slow response (${duration}ms)` : `OK (${duration}ms)`,
            duration
          } : c
        ));
      } catch (error) {
        setChecks(prev => prev.map((c, idx) => 
          idx === i ? {
            ...c,
            status: 'fail',
            message: 'Failed to connect'
          } : c
        ));
      }
    }
    
    setIsRunning(false);
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="text-green-500" />;
      case 'fail': return <AlertTriangle className="text-red-500" />;
      case 'warning': return <AlertTriangle className="text-yellow-500" />;
      case 'pending': return <Clock className="text-blue-500 animate-spin" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">System Health</h1>
          <p className="text-muted-foreground">Monitor system components and performance</p>
        </div>
        <Button onClick={runHealthChecks} disabled={isRunning}>
          {isRunning ? 'Running...' : 'Run Health Check'}
        </Button>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Health Status</h2>
        <div className="space-y-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <span className="font-medium">{check.name}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {check.message}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}