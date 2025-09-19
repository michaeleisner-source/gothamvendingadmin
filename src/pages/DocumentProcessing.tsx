import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Brain, MapPin, Users, Building, Phone } from 'lucide-react';
import DocumentProcessor from '@/components/DocumentProcessor';
import { ExtractedAddress } from '@/lib/ai-address-extractor';
import { useToast } from '@/hooks/use-toast';

const DocumentProcessing = () => {
  const { toast } = useToast();

  const handleAddressExtracted = (address: ExtractedAddress) => {
    console.log('Address extracted:', address);
    
    if (address.address_full && address.confidence !== 'low') {
      // Here you could automatically populate form fields, create prospect records, etc.
      toast({
        title: "Address Processed",
        description: "Address data is ready for use in your workflows",
      });
    }
  };

  const features = [
    {
      icon: MapPin,
      title: "Address Extraction",
      description: "Extract complete property addresses including street, city, state, and ZIP codes from any document",
      color: "text-green-600"
    },
    {
      icon: Users,
      title: "Contact Information",
      description: "Parse contact names, emails, and phone numbers from business documents and contracts",
      color: "text-blue-600"
    },
    {
      icon: Building,
      title: "Business Details",
      description: "Identify company names, business types, and organizational information",
      color: "text-purple-600"
    },
    {
      icon: Phone,
      title: "Communication Data",
      description: "Extract all communication details including multiple phone numbers and email addresses",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          AI Document Processing
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Advanced AI-powered document analysis to extract structured data from PDFs, contracts, 
          and business documents. Replace manual data entry with intelligent automation.
        </p>
        <Badge variant="secondary" className="mt-2">
          Powered by OpenAI GPT-4
        </Badge>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <Card key={feature.title} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <IconComponent className={`h-6 w-6 ${feature.color} mt-1`} />
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Processing Interface */}
      <DocumentProcessor onAddressExtracted={handleAddressExtracted} />

      {/* Implementation Example */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Implementation Example
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-background rounded-lg p-4 border">
              <h4 className="font-semibold mb-2">Before (Manual Detection)</h4>
              <code className="text-sm text-muted-foreground">
                const detected_address = parseAddressManually(text);
              </code>
            </div>
            
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <h4 className="font-semibold mb-2 text-primary">After (AI-Powered)</h4>
              <code className="text-sm">
                const ai = await callYourModel({"{"}
                <br />
                &nbsp;&nbsp;prompt: "Extract property address, city, state, zip from this PDF text.",
                <br />
                &nbsp;&nbsp;text,
                <br />
                {"}"});
                <br />
                const detected_address = ai.address_full || null;
              </code>
            </div>
            
            <p className="text-sm text-muted-foreground">
              The AI model automatically identifies and structures address information with confidence scoring,
              eliminating the need for complex regex patterns and manual parsing logic.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentProcessing;