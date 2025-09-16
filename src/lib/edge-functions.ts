import { supabase } from '@/integrations/supabase/client';

type SalesTotalsParams = {
  startISO?: string;
  endISO?: string;
  days?: number;
};

export class EdgeFunctionClient {
  /**
   * Call an edge function with automatic auth header handling
   */
  static async call(functionName: string, data?: any) {
    try {
      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: data,
      });

      if (error) {
        console.error(`Edge function ${functionName} error:`, error);
        throw error;
      }

      return result;
    } catch (error) {
      console.error(`Failed to call edge function ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Example: Call the demo-protected function
   */
  static async callDemoProtected() {
    return this.call('demo-protected');
  }

  /**
   * Get sales totals for a date range
   */
  static async getSalesTotals(params?: SalesTotalsParams) {
    return this.call('sales-totals', params);
  }
}

// Example usage:
// const result = await EdgeFunctionClient.callDemoProtected();
// console.log('Demo protected result:', result);
//
// const totals = await EdgeFunctionClient.getSalesTotals({ days: 30 });
// console.log('Sales totals:', totals);