import FirecrawlApp from '@mendable/firecrawl-js';

interface ErrorResponse {
  success: false;
  error: string;
}

interface ScrapeResponse {
  success: true;
  data: {
    markdown: string;
    html: string;
    metadata: {
      title: string;
      description: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
    };
  };
}

type FirecrawlResponse = ScrapeResponse | ErrorResponse;

export class FirecrawlService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  private static firecrawlApp: FirecrawlApp | null = null;

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    this.firecrawlApp = new FirecrawlApp({ apiKey });
    console.log('API key saved successfully');
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log('Testing API key with Firecrawl API');
      this.firecrawlApp = new FirecrawlApp({ apiKey });
      // A simple test scrape to verify the API key
      const testResponse = await this.firecrawlApp.scrape('https://example.com') as FirecrawlResponse;
      return testResponse.success;
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  }

  static async scrapeProduct(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found. Please set your Firecrawl API key first.' };
    }

    try {
      console.log('Making scrape request to Firecrawl API for:', url);
      if (!this.firecrawlApp) {
        this.firecrawlApp = new FirecrawlApp({ apiKey });
      }

      const scrapeResponse = await this.firecrawlApp.scrape(url, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      }) as FirecrawlResponse;

      if (!scrapeResponse.success) {
        console.error('Scrape failed:', (scrapeResponse as ErrorResponse).error);
        return { 
          success: false, 
          error: (scrapeResponse as ErrorResponse).error || 'Failed to scrape website' 
        };
      }

      // Extract product information from scraped content
      const productInfo = this.extractProductInfo(scrapeResponse.data);
      
      console.log('Scrape successful:', productInfo);
      return { 
        success: true,
        data: productInfo 
      };
    } catch (error) {
      console.error('Error during scrape:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API' 
      };
    }
  }

  private static extractProductInfo(data: ScrapeResponse['data']): any {
    const { markdown, metadata } = data;
    
    // Extract product information using various strategies
    const productInfo: any = {
      name: '',
      description: '',
      price: null,
      cost: null,
      image_url: '',
      category: '',
      sku: '',
    };

    // Try to get product name from title or metadata
    productInfo.name = metadata.ogTitle || metadata.title || '';
    
    // Clean up the name (remove common e-commerce suffixes)
    productInfo.name = productInfo.name
      .replace(/\s*\|\s*.*$/, '') // Remove everything after |
      .replace(/\s*-\s*.*$/, '') // Remove everything after -
      .replace(/\s*:\s*.*$/, '') // Remove everything after :
      .trim();

    // Get description
    productInfo.description = metadata.ogDescription || metadata.description || '';

    // Get image
    productInfo.image_url = metadata.ogImage || '';

    // Try to extract price from markdown content
    const pricePatterns = [
      /\$(\d+\.?\d*)/g,
      /Price[:\s]*\$?(\d+\.?\d*)/gi,
      /(\d+\.?\d*)\s*USD/gi,
    ];

    for (const pattern of pricePatterns) {
      const matches = markdown.match(pattern);
      if (matches && matches.length > 0) {
        // Get the first price found
        const priceMatch = matches[0].match(/(\d+\.?\d*)/);
        if (priceMatch) {
          productInfo.price = parseFloat(priceMatch[1]);
          break;
        }
      }
    }

    // Try to extract category from content
    const categoryKeywords = [
      'snacks', 'candy', 'chocolate', 'chips', 'cookies', 'crackers',
      'drinks', 'soda', 'water', 'juice', 'coffee', 'tea',
      'food', 'grocery', 'beverage', 'nutrition', 'protein',
      'electronics', 'toys', 'books', 'clothing', 'accessories'
    ];

    const lowerContent = markdown.toLowerCase();
    for (const keyword of categoryKeywords) {
      if (lowerContent.includes(keyword)) {
        productInfo.category = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        break;
      }
    }

    // Try to extract SKU or product code
    const skuPatterns = [
      /SKU[:\s]*([A-Z0-9-]+)/gi,
      /Product Code[:\s]*([A-Z0-9-]+)/gi,
      /Item[:\s]*#?([A-Z0-9-]+)/gi,
    ];

    for (const pattern of skuPatterns) {
      const match = markdown.match(pattern);
      if (match && match[1]) {
        productInfo.sku = match[1];
        break;
      }
    }

    return productInfo;
  }
}