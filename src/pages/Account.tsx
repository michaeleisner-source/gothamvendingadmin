import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Account() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [orgName, setOrgName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      if (profileData?.org_id) {
        // Load organization
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.org_id)
          .single();

        setOrganization(orgData);
        setOrgName(orgData?.name || "");
      }
    } catch (error: any) {
      console.error('Error loading user data:', error);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Call the bootstrap function
      const { data, error } = await supabase.rpc('bootstrap_org_for_me', {
        p_org_name: orgName.trim()
      });

      if (error) throw error;

      toast({
        title: "Organization created!",
        description: `${orgName} has been set up successfully.`,
      });

      // Reload data
      await loadUserData();
    } catch (error: any) {
      toast({
        title: "Failed to create organization",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!profile) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Account</h1>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={profile.email || ""} disabled />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={profile.full_name || ""} disabled />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={profile.role || "User"} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            {organization ? (
              <div className="space-y-4">
                <div>
                  <Label>Organization Name</Label>
                  <Input value={organization.name} disabled />
                </div>
                <div>
                  <Label>Status</Label>
                  <Input value="Active" disabled />
                </div>
                <div>
                  <Label>Created</Label>
                  <Input 
                    value={new Date(organization.created_at).toLocaleDateString()} 
                    disabled 
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateOrganization} className="space-y-4">
                <div>
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Enter your company name"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Organization
                </Button>
                <p className="text-sm text-muted-foreground">
                  Create your organization to start managing vending machines, locations, and inventory.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}