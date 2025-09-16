import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Timer, Zap, TrendingUp, Activity } from 'lucide-react';

interface TestResult {
  name: string;
  duration: number;
  requests: number;
  rps: number;
  success: number;
  failed: number;
  avgResponseTime: number;
  p95ResponseTime: number;
}

interface TestConfig {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST';
  requests: number;
  concurrent: number;
}

export default function PerformanceTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');

  const testConfigs: TestConfig[] = [
    { name: 'Dashboard Load', endpoint: '/api/dashboard', method: 'GET', requests: 50, concurrent: 5 },
    { name: 'User Profile', endpoint: '/api/profile', method: 'GET', requests: 30, concurrent: 3 },
    { name: 'Search API', endpoint: '/api/search', method: 'POST', requests: 40, concurrent: 4 },
    { name: 'Reports Generation', endpoint: '/api/reports', method: 'GET', requests: 20, concurrent: 2 }
  ];

  const runPerformanceTest = async (config: TestConfig) => {
    setIsRunning(true);
    setProgress(0);
    setSelectedTest(config.name);
    
    const startTime = Date.now();
    const responseTimes: number[] = [];
    let successCount = 0;
    let failedCount = 0;

    // Simulate performance testing
    for (let i = 0; i < config.requests; i++) {
      const requestStart = Date.now();
      
      try {
        // Simulate API call with random response time
        await new Promise(resolve => 
          setTimeout(resolve, Math.random() * 300 + 100)
        );
        
        const responseTime = Date.now() - requestStart;
        responseTimes.push(responseTime);
        successCount++;
      } catch {
        failedCount++;
      }
      
      setProgress(((i + 1) / config.requests) * 100);
      
      // Small delay to prevent overwhelming
      if (i % config.concurrent === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    const totalDuration = Date.now() - startTime;
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p95ResponseTime = sortedTimes[Math.floor(responseTimes.length * 0.95)];
    
    const result: TestResult = {
      name: config.name,
      duration: totalDuration,
      requests: config.requests,
      rps: (config.requests / (totalDuration / 1000)),
      success: successCount,
      failed: failedCount,
      avgResponseTime,
      p95ResponseTime
    };
    
    setResults(prev => [result, ...prev.slice(0, 4)]);
    setIsRunning(false);
    setProgress(0);
    setSelectedTest('');
  };

  const runAllTests = async () => {
    for (const config of testConfigs) {
      await runPerformanceTest(config);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getPerformanceRating = (avgTime: number) => {
    if (avgTime < 100) return { label: 'Excellent', color: 'bg-green-500' };
    if (avgTime < 200) return { label: 'Good', color: 'bg-blue-500' };
    if (avgTime < 500) return { label: 'Average', color: 'bg-yellow-500' };
    return { label: 'Poor', color: 'bg-red-500' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Performance Testing</h1>
            <p className="text-muted-foreground">Load test API endpoints and measure performance</p>
          </div>
        </div>
        <Button onClick={runAllTests} disabled={isRunning}>
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </Button>
      </div>

      {isRunning && (
        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Testing: {selectedTest}</span>
              <span className="text-sm text-muted-foreground">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Tests
          </h2>
          <div className="space-y-3">
            {testConfigs.map((config, index) => (
              <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{config.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {config.requests} requests, {config.concurrent} concurrent
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => runPerformanceTest(config)}
                  disabled={isRunning}
                >
                  Test
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Results
          </h2>
          <div className="space-y-4">
            {results.map((result, index) => {
              const rating = getPerformanceRating(result.avgResponseTime);
              return (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{result.name}</span>
                    <Badge className={`${rating.color} text-white`}>
                      {rating.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>RPS: {result.rps.toFixed(1)}</div>
                    <div>Duration: {result.duration}ms</div>
                    <div>Avg: {result.avgResponseTime.toFixed(0)}ms</div>
                    <div>P95: {result.p95ResponseTime.toFixed(0)}ms</div>
                    <div>Success: {result.success}</div>
                    <div>Failed: {result.failed}</div>
                  </div>
                </div>
              );
            })}
            {results.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No test results yet. Run a performance test to see results.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}