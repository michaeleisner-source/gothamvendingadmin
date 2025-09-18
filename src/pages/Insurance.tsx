import { useState } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InsurancePolicies } from "@/components/insurance/InsurancePolicies";
import { InsuranceAllocations } from "@/components/insurance/InsuranceAllocations";
import { InsuranceCertificates } from "@/components/insurance/InsuranceCertificates";
import { InsuranceCostCalculator } from "@/components/insurance/InsuranceCostCalculator";
import { Shield, FileText, Calculator, Settings } from "lucide-react";

export function Insurance() {
  usePageSEO({
    title: "Insurance Management",
    description: "Manage insurance policies, allocations, certificates, and calculate costs for your vending machine operations"
  });

  const [activeTab, setActiveTab] = useState("policies");

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Insurance Management" />
      <p className="text-muted-foreground -mt-4 mb-2">
        Manage policies, allocations, and calculate insurance costs
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="allocations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Allocations
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Certificates
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Cost Calculator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Policies</CardTitle>
              <CardDescription>
                Manage your insurance policies including coverage periods, premiums, and documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InsurancePolicies />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Allocations</CardTitle>
              <CardDescription>
                Configure how insurance costs are allocated across machines, locations, or globally
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InsuranceAllocations />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Certificates</CardTitle>
              <CardDescription>
                Manage certificates of insurance (COI) for locations that require proof of coverage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InsuranceCertificates />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Cost Calculator</CardTitle>
              <CardDescription>
                Calculate prorated insurance costs for machines over specific time periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InsuranceCostCalculator />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Insurance;