import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NewContract() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    location_id: "",
    contract_number: "",
    revenue_share_pct: "",
    commission_flat_cents: "",
    term_months: "12",
    auto_renew: true,
    cancellation_notice_days: "30",
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title || !formData.contract_number) {
      toast({
        title: "Validation Error",
        description: "Please fill in the required fields: Title and Contract Number",
        variant: "destructive",
      });
      return;
    }

    try {
      // For now, just show success message and navigate back
      // In a real app, you would submit to Supabase here
      toast({
        title: "Contract Created",
        description: "New contract has been created successfully!",
      });
      
      navigate("/contracts");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create contract. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Contract</h1>
          <p className="text-muted-foreground">Create a new vending service agreement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contract Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Contract Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Vending Services Agreement"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contract_number">Contract Number *</Label>
                <Input
                  id="contract_number"
                  value={formData.contract_number}
                  onChange={(e) => handleInputChange("contract_number", e.target.value)}
                  placeholder="CON-2024-001"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_select">Location</Label>
              <Select onValueChange={(value) => handleInputChange("location_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo-1">Downtown Office Building</SelectItem>
                  <SelectItem value="demo-2">University Student Center</SelectItem>
                  <SelectItem value="demo-3">Hospital Main Lobby</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Financial Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="revenue_share">Revenue Share (%)</Label>
                <Input
                  id="revenue_share"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.revenue_share_pct}
                  onChange={(e) => handleInputChange("revenue_share_pct", e.target.value)}
                  placeholder="15.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="flat_commission">Flat Commission ($)</Label>
                <Input
                  id="flat_commission"
                  type="number"
                  min="0"
                  value={formData.commission_flat_cents ? (parseInt(formData.commission_flat_cents) / 100).toString() : ""}
                  onChange={(e) => handleInputChange("commission_flat_cents", (parseFloat(e.target.value || "0") * 100).toString())}
                  placeholder="250.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="term_months">Term (Months)</Label>
                <Select 
                  value={formData.term_months} 
                  onValueChange={(value) => handleInputChange("term_months", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="36">36 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cancellation_notice">Cancellation Notice (Days)</Label>
                <Input
                  id="cancellation_notice"
                  type="number"
                  min="1"
                  value={formData.cancellation_notice_days}
                  onChange={(e) => handleInputChange("cancellation_notice_days", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Create Contract
          </Button>
        </div>
      </form>
    </div>
  );
}