import { supabase } from '@/integrations/supabase/client';

/** Check if the app is running in demo mode (no auth required) */
export function isDemoMode(): boolean {
  // Disable demo mode to enable proper authentication
  return false;
}

/** Get authentication headers for API calls */
export async function getAuthHeaders(): Promise<Record<string, string> | undefined> {
  if (isDemoMode()) {
    // In demo mode, we might still try to get auth headers if available
    // but don't require them
    try {
      const session = await supabase.auth.getSession();
      const token = session.data?.session?.access_token;
      return token ? { Authorization: `Bearer ${token}` } : undefined;
    } catch {
      return undefined;
    }
  }

  // In normal mode, require auth headers
  const session = await supabase.auth.getSession();
  const token = session.data?.session?.access_token;
  if (!token) throw new Error('Authentication required');
  return { Authorization: `Bearer ${token}` };
}

/** Check if user is authenticated */
export async function isAuthenticated(): Promise<boolean> {
  if (isDemoMode()) return true; // Always authenticated in demo mode
  
  try {
    const session = await supabase.auth.getSession();
    return !!session.data?.session?.access_token;
  } catch {
    return false;
  }
}