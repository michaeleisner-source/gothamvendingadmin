import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import { corsHeaders } from '../_shared/cors.ts'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Tables to backup
const BACKUP_TABLES = [
  'leads',
  'locations', 
  'machines',
  'products',
  'sales',
  'inventory_levels',
  'contracts',
  'commission_statements',
  'machine_finance',
  'insurance_policies',
  'cash_collections'
]

interface BackupResult {
  success: boolean;
  timestamp: string;
  tables: string[];
  recordCounts: Record<string, number>;
  backupId: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting daily backup process...')
    
    const backupId = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}`
    const timestamp = new Date().toISOString()
    const recordCounts: Record<string, number> = {}
    const backupData: Record<string, any[]> = {}

    // Backup each table
    for (const tableName of BACKUP_TABLES) {
      try {
        console.log(`Backing up table: ${tableName}`)
        
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
        
        if (error) {
          console.error(`Error backing up ${tableName}:`, error)
          continue
        }

        backupData[tableName] = data || []
        recordCounts[tableName] = count || 0
        
        console.log(`Backed up ${recordCounts[tableName]} records from ${tableName}`)
      } catch (tableError) {
        console.error(`Failed to backup table ${tableName}:`, tableError)
        recordCounts[tableName] = -1 // Mark as failed
      }
    }

    // Store backup metadata and compressed data
    const { error: backupError } = await supabase
      .from('system_backups')
      .insert({
        backup_id: backupId,
        created_at: timestamp,
        table_counts: recordCounts,
        backup_data: backupData,
        status: 'completed'
      })

    if (backupError) {
      console.error('Failed to store backup:', backupError)
      
      // Try to store in storage as fallback
      const backupFileName = `backups/${backupId}.json`
      const { error: storageError } = await supabase.storage
        .from('system-backups')
        .upload(backupFileName, JSON.stringify({
          backupId,
          timestamp,
          recordCounts,
          backupData
        }))

      if (storageError) {
        console.error('Failed to store backup in storage:', storageError)
        throw new Error('Backup storage failed')
      }
    }

    const result: BackupResult = {
      success: true,
      timestamp,
      tables: BACKUP_TABLES,
      recordCounts,
      backupId
    }

    console.log('Backup completed successfully:', result)
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Backup failed:', error)
    
    const result: BackupResult = {
      success: false,
      timestamp: new Date().toISOString(),
      tables: BACKUP_TABLES,
      recordCounts: {},
      backupId: '',
      error: error.message
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})