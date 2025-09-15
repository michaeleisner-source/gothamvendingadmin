import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

const Account = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleInitializeOrg = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('bootstrap_org_for_me', { p_org_name: 'Gotham Vending' });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Organization initialized with ID: ${data}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your account and organization settings (no authentication required)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {user ? (
              <>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">User Information</h3>
                  <p className="text-muted-foreground">
                    Email: <span className="font-mono">{user.email}</span>
                  </p>
                  <p className="text-muted-foreground">
                    User ID: <span className="font-mono text-xs">{user.id}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Organization</h3>
                  <p className="text-sm text-muted-foreground">
                    Initialize your organization to start using the multi-tenant features.
                  </p>
                  <Button 
                    onClick={handleInitializeOrg} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Initializing..." : "Initialize My Org"}
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSignOut} 
                    variant="outline"
                    className="w-full"
                  >
                    Sign out
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4 text-center py-8">
                <h3 className="text-lg font-semibold">No Authentication Required</h3>
                <p className="text-muted-foreground">
                  This application is currently running in demo mode without authentication requirements.
                  Account features will be available when authentication is enabled.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Demo Mode:</strong> All features are accessible without signing in.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Account;