import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractStructuredAddress, ExtractedAddress } from '@/lib/ai-address-extractor';

interface DocumentProcessorProps {
  onAddressExtracted?: (address: ExtractedAddress) => void;
}

const DocumentProcessor: React.FC<DocumentProcessorProps> = ({ onAddressExtracted }) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentText, setDocumentText] = useState('');
  const [extractedAddress, setExtractedAddress] = useState<ExtractedAddress | null>(null);

  const handleTextSubmit = async () => {
    if (!documentText.trim()) {
      toast({
        title: "Error",
        description: "Please enter document text to process",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Replace detected_address section with AI-powered extraction
      const ai = await extractStructuredAddress(documentText);
      const detected_address = ai.address_full || null;
      
      setExtractedAddress(ai);
      onAddressExtracted?.(ai);

      if (detected_address && ai.confidence !== 'low') {
        toast({
          title: "Address Extracted",
          description: `Found address with ${ai.confidence} confidence`,
        });
      } else if (ai.error) {
        toast({
          title: "Extraction Failed",
          description: ai.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "No Address Found",
          description: "Could not identify a clear address in the document",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfidenceBadgeVariant = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI-Powered Document Processing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Document Text</label>
            <Textarea
              placeholder="Paste your PDF or document text here for AI address extraction..."
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              className="min-h-32"
            />
          </div>
          
          <Button 
            onClick={handleTextSubmit} 
            disabled={isProcessing || !documentText.trim()}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing with AI...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Extract Address
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {extractedAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Extracted Address
              </span>
              <Badge variant={getConfidenceBadgeVariant(extractedAddress.confidence)}>
                {extractedAddress.confidence} confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {extractedAddress.address_full ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Address</label>
                  <p className="font-mono text-sm">{extractedAddress.address_full}</p>
                </div>
                {extractedAddress.address_line1 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Street</label>
                    <p className="font-mono text-sm">{extractedAddress.address_line1}</p>
                  </div>
                )}
                {extractedAddress.city && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">City</label>
                    <p className="font-mono text-sm">{extractedAddress.city}</p>
                  </div>
                )}
                {extractedAddress.state && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">State</label>
                    <p className="font-mono text-sm">{extractedAddress.state}</p>
                  </div>
                )}
                {extractedAddress.zip && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ZIP</label>
                    <p className="font-mono text-sm">{extractedAddress.zip}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                {extractedAddress.error || "No address detected in the document"}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentProcessor;