import { useState } from "react";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, ExternalLink, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface InsuranceCertificate {
  id: string;
  policy_id: string;
  location_id: string;
  certificate_url: string;
  issued_at: string;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  insurance_policies: {
    name: string;
  };
  locations: {
    name: string;
  };
}

export function InsuranceCertificates() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<InsuranceCertificate | null>(null);
  const { toast } = useToast();

  const { data: certificates, isLoading, refetch } = useOptimizedQuery({
    queryKey: ["insurance-certificates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurance_certificates")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Fetch related data separately to handle missing columns
      const certificatesWithRelated = await Promise.all(
        (data || []).map(async (certificate) => {
          let policyName = "Unknown Policy";
          let locationName = "Unknown Location";
          
          // Get policy name
          if (certificate.policy_id) {
            const { data: policy } = await supabase
              .from("insurance_policies")
              .select("name")
              .eq("id", certificate.policy_id)
              .maybeSingle();
            policyName = policy?.name || "Unknown Policy";
          }
          
          // Get location name
          if (certificate.location_id) {
            const { data: location } = await supabase
              .from("locations")
              .select("name")
              .eq("id", certificate.location_id)
              .maybeSingle();
            locationName = location?.name || "Unknown Location";
          }
          
          return {
            ...certificate,
            insurance_policies: { name: policyName },
            locations: { name: locationName },
          } as InsuranceCertificate;
        })
      );
      
      return certificatesWithRelated;
    },
  });

  const { data: policies } = useOptimizedQuery({
    queryKey: ["policies-for-certificate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurance_policies")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: locations } = useOptimizedQuery({
    queryKey: ["locations-for-certificate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const certificateData = {
      policy_id: formData.get("policy_id") as string,
      location_id: formData.get("location_id") as string,
      certificate_url: formData.get("certificate_url") as string,
      issued_at: formData.get("issued_at") as string,
      expires_at: formData.get("expires_at") as string || null,
      notes: formData.get("notes") as string || null,
    };

    try {
      // Get current org_id  
      const { data: orgData, error: orgError } = await supabase.rpc('current_org');
      if (orgError) throw orgError;
      
      const dataWithOrg = { ...certificateData, org_id: orgData };
      
      if (editingCertificate) {
        const { error } = await supabase
          .from("insurance_certificates")
          .update(certificateData)
          .eq("id", editingCertificate.id);
        if (error) throw error;
        toast({ title: "Certificate updated successfully" });
      } else {
        const { error } = await supabase
          .from("insurance_certificates")
          .insert(dataWithOrg);
        if (error) throw error;
        toast({ title: "Certificate created successfully" });
      }
      
      setIsCreating(false);
      setEditingCertificate(null);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("insurance_certificates")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast({ title: "Certificate deleted successfully" });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const CertificateForm = ({ certificate }: { certificate?: InsuranceCertificate }) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="policy_id">Insurance Policy *</Label>
        <Select name="policy_id" defaultValue={certificate?.policy_id || ""} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a policy" />
          </SelectTrigger>
          <SelectContent>
            {policies?.map((policy) => (
              <SelectItem key={policy.id} value={policy.id}>
                {policy.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="location_id">Location *</Label>
        <Select name="location_id" defaultValue={certificate?.location_id || ""} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a location" />
          </SelectTrigger>
          <SelectContent>
            {locations?.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="certificate_url">Certificate URL *</Label>
        <Input
          id="certificate_url"
          name="certificate_url"
          type="url"
          defaultValue={certificate?.certificate_url || ""}
          placeholder="https://..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="issued_at">Issued Date *</Label>
          <Input
            id="issued_at"
            name="issued_at"
            type="date"
            defaultValue={certificate?.issued_at || new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        <div>
          <Label htmlFor="expires_at">Expiration Date</Label>
          <Input
            id="expires_at"
            name="expires_at"
            type="date"
            defaultValue={certificate?.expires_at || ""}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={certificate?.notes || ""}
          placeholder="Additional certificate information..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            setIsCreating(false);
            setEditingCertificate(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit">
          {certificate ? "Update Certificate" : "Create Certificate"}
        </Button>
      </div>
    </form>
  );

  if (isLoading) {
    return <div className="text-center py-8">Loading certificates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Insurance Certificates</h3>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Certificate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Insurance Certificate</DialogTitle>
              <DialogDescription>
                Upload a certificate of insurance (COI) for a specific location and policy.
              </DialogDescription>
            </DialogHeader>
            <CertificateForm />
          </DialogContent>
        </Dialog>
      </div>

      {!certificates?.length ? (
        <div className="text-center py-8 text-muted-foreground">
          No insurance certificates found. Upload certificates for locations that require proof of coverage.
        </div>
      ) : (
        <div className="grid gap-4">
          {certificates.map((certificate) => {
            const isExpired = certificate.expires_at && new Date(certificate.expires_at) < new Date();
            
            return (
              <Card key={certificate.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {certificate.insurance_policies.name}
                        {isExpired && <Badge variant="destructive">Expired</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {certificate.locations.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={certificate.certificate_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Dialog open={editingCertificate?.id === certificate.id} onOpenChange={(open) => !open && setEditingCertificate(null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setEditingCertificate(certificate)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Edit Insurance Certificate</DialogTitle>
                            <DialogDescription>
                              Update the certificate details and information.
                            </DialogDescription>
                          </DialogHeader>
                          <CertificateForm certificate={certificate} />
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Certificate</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this certificate? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(certificate.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Issued Date</p>
                      <p>{format(new Date(certificate.issued_at), "MMM d, yyyy")}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Expiration Date</p>
                      <p>{certificate.expires_at ? format(new Date(certificate.expires_at), "MMM d, yyyy") : "No expiration"}</p>
                    </div>
                  </div>
                  {certificate.notes && (
                    <div className="mt-4">
                      <p className="font-medium text-muted-foreground text-sm">Notes</p>
                      <p className="text-sm">{certificate.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}