import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Clock, Database, AlertTriangle } from "lucide-react";
import { useBackupStatus } from "@/hooks/useBackupStatus";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export function BackupStatusWidget() {
  const { data: backup, isLoading } = useBackupStatus();
  const [isTriggering, setIsTriggering] = useState(false);

  const triggerBackup = async () => {
    setIsTriggering(true);
    try {
      const { error } = await supabase.functions.invoke('daily-backup', {
        body: { manual: true }
      });

      if (error) {
        toast({
          title: "Backup Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Backup Started",
          description: "Manual backup has been triggered successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger backup",
        variant: "destructive",
      });
    } finally {
      setIsTriggering(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Data Backup</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-4 bg-muted rounded w-3/4"></div>
        </CardContent>
      </Card>
    );
  }

  const statusIcon = backup?.status === 'healthy' ? Shield : 
                    backup?.status === 'warning' ? Clock : AlertTriangle;
  const StatusIcon = statusIcon;

  const statusColor = backup?.status === 'healthy' ? 'default' : 
                     backup?.status === 'warning' ? 'secondary' : 'destructive';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Data Backup</CardTitle>
        <StatusIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={statusColor} className="capitalize">
            {backup?.status || 'Unknown'}
          </Badge>
        </div>
        
        {backup?.lastBackup && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Backup</span>
            <span className="text-sm font-medium">
              {backup.lastBackup.toLocaleDateString()}
            </span>
          </div>
        )}

        {backup?.nextBackup && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Next Backup</span>
            <span className="text-sm font-medium">
              {backup.nextBackup.toLocaleDateString()}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Backups</span>
          <span className="text-sm font-medium">{backup?.backupCount || 0}</span>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={triggerBackup}
          disabled={isTriggering}
          className="w-full"
        >
          {isTriggering ? 'Backing up...' : 'Manual Backup'}
        </Button>

        {backup?.status === 'error' && (
          <div className="text-xs text-destructive">
            Backup system needs attention
          </div>
        )}
      </CardContent>
    </Card>
  );
}