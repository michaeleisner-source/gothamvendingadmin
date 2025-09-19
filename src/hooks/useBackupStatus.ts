import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BackupStatus {
  lastBackup: Date | null;
  backupCount: number;
  status: 'healthy' | 'warning' | 'error';
  nextBackup: Date | null;
}

export function useBackupStatus() {
  return useQuery({
    queryKey: ['backup-status'],
    queryFn: async (): Promise<BackupStatus> => {
      try {
        const { data: backups, error } = await supabase
          .from('system_backups')
          .select('created_at, status')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching backup status:', error);
          return {
            lastBackup: null,
            backupCount: 0,
            status: 'error',
            nextBackup: null
          };
        }

        const lastBackup = backups && backups.length > 0 
          ? new Date(backups[0].created_at) 
          : null;
        
        const backupCount = backups?.length || 0;
        
        // Calculate next backup (daily at 2 AM UTC)
        const now = new Date();
        const nextBackup = new Date();
        nextBackup.setUTCHours(2, 0, 0, 0);
        if (nextBackup <= now) {
          nextBackup.setUTCDate(nextBackup.getUTCDate() + 1);
        }

        // Determine status
        let status: BackupStatus['status'] = 'healthy';
        if (!lastBackup) {
          status = 'error';
        } else {
          const hoursSinceLastBackup = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastBackup > 48) {
            status = 'error';
          } else if (hoursSinceLastBackup > 30) {
            status = 'warning';
          }
        }

        return {
          lastBackup,
          backupCount,
          status,
          nextBackup
        };
      } catch (error) {
        console.error('Backup status error:', error);
        return {
          lastBackup: null,
          backupCount: 0,
          status: 'error',
          nextBackup: null
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Check every 10 minutes
  });
}