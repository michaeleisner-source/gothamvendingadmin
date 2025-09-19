/**
 * Example usage of AI-powered address extraction
 * This replaces manual address detection with intelligent AI processing
 */

import { callYourModel, extractAddressFromText, extractStructuredAddress } from '@/lib/ai-address-extractor';

// Example PDF/document text
const sampleDocumentText = `
PROPERTY LEASE AGREEMENT

Property Address: 123 Main Street, Suite 4B, New York, NY 10001

This agreement is between ABC Vending LLC and Downtown Coffee Shop located at the above address.

Business Details:
- Contact: John Smith
- Phone: (555) 123-4567
- Email: john@downtowncoffee.com

The property is a high-traffic retail location with estimated daily foot traffic of 300-500 customers.
Monthly rent for vending machine placement is $200.
`;

/**
 * BEFORE: Manual address detection (complex and error-prone)
 */
function manualAddressExtraction(text: string): string | null {
  // Complex regex patterns, parsing rules, etc.
  const addressRegex = /(?:\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Place|Pl|Court|Ct))[^,]*, \s*[\w\s]+,\s*[A-Z]{2}\s*\d{5}/gi;
  const matches = text.match(addressRegex);
  return matches ? matches[0] : null;
}

/**
 * AFTER: AI-powered extraction (simple and intelligent)
 */
export async function demonstrateAIExtraction() {
  console.log('=== AI Address Extraction Demo ===');

  // Method 1: Simple address extraction
  console.log('\n1. Simple Address Extraction:');
  const simpleAddress = await extractAddressFromText(sampleDocumentText);
  console.log('Detected address:', simpleAddress);

  // Method 2: Structured extraction with confidence
  console.log('\n2. Structured Extraction:');
  const structuredAddress = await extractStructuredAddress(sampleDocumentText);
  console.log('Structured result:', JSON.stringify(structuredAddress, null, 2));

  // Method 3: Direct AI model call (as requested by user)
  console.log('\n3. Direct AI Model Call:');
  const ai = await callYourModel({
    prompt: "Extract property address, city, state, zip from this PDF text.",
    text: sampleDocumentText,
  });
  const detected_address = ai.address_full || null;
  
  console.log('AI extracted address:', detected_address);
  console.log('Confidence level:', ai.confidence);
  
  return {
    simple: simpleAddress,
    structured: structuredAddress,
    direct: detected_address
  };
}

/**
 * Integration example for prospect creation workflow
 */
export async function createProspectFromDocument(documentText: string) {
  try {
    // Replace detected_address section with AI extraction
    const ai = await callYourModel({
      prompt: "Extract property address, city, state, zip from this PDF text.",
      text: documentText,
    });
    const detected_address = ai.address_full || null;
    
    if (detected_address && ai.confidence !== 'low') {
      // Auto-populate prospect form
      const prospectData = {
        business_name: 'Extracted from document', // Could be enhanced to extract business name too
        address_line1: ai.address_line1,
        city: ai.city,
        state: ai.state,
        postal_code: ai.zip,
        // ... other fields
      };
      
      console.log('Ready to create prospect with extracted data:', prospectData);
      return prospectData;
    } else {
      console.warn('No reliable address found in document');
      return null;
    }
  } catch (error) {
    console.error('Failed to extract address from document:', error);
    return null;
  }
}

/**
 * Contract processing workflow
 */
export async function processContract(contractText: string) {
  const extractedData = await extractStructuredAddress(contractText);
  
  if (extractedData.address_full) {
    console.log(`Contract address extracted with ${extractedData.confidence} confidence:`);
    console.log(`- Full Address: ${extractedData.address_full}`);
    console.log(`- Street: ${extractedData.address_line1}`);
    console.log(`- City: ${extractedData.city}`);
    console.log(`- State: ${extractedData.state}`);
    console.log(`- ZIP: ${extractedData.zip}`);
    
    // Could automatically create location record, etc.
    return extractedData;
  }
  
  return null;
}
