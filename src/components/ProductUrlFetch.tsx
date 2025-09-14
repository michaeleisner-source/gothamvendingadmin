import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FirecrawlService } from '@/utils/FirecrawlService';
import { toast } from "sonner";
import { Loader2, Link, Key } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ProductUrlFetchProps {
  onProductFetched: (productData: any) => void;
}

export const ProductUrlFetch = ({ onProductFetched }: ProductUrlFetchProps) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  const handleApiKeySubmit = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }
    
    FirecrawlService.saveApiKey(apiKey);
    setShowApiKeyDialog(false);
    toast.success('API key saved successfully');
  };

  const handleFetchProduct = async () => {
    if (!url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    if (!FirecrawlService.getApiKey()) {
      setShowApiKeyDialog(true);
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await FirecrawlService.scrapeProduct(url);
      
      if (result.success && result.data) {
        toast.success('Product information fetched successfully!');
        onProductFetched(result.data);
        setUrl(''); // Clear the URL after successful fetch
      } else {
        toast.error(result.error || 'Failed to fetch product information');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to fetch product information');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Add Product from URL
          </CardTitle>
          <CardDescription>
            Enter a product URL to automatically fetch product information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="url"
                placeholder="https://example.com/product"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleFetchProduct} 
              disabled={isLoading || !url.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                'Fetch Product'
              )}
            </Button>
          </div>
          
          {!FirecrawlService.getApiKey() && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-2 text-amber-800">
                <Key className="w-4 h-4" />
                <span className="text-sm">
                  Firecrawl API key required.{' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-amber-800 underline"
                    onClick={() => setShowApiKeyDialog(true)}
                  >
                    Set API key
                  </Button>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Firecrawl API Key</DialogTitle>
            <DialogDescription>
              Enter your Firecrawl API key to enable product URL fetching.{' '}
              <a 
                href="https://firecrawl.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Get your API key here
              </a>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="fc-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleApiKeySubmit}>
                Save API Key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};