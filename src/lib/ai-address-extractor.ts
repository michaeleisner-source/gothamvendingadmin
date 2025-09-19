import { supabase } from '@/integrations/supabase/client';

export interface ExtractedAddress {
  address_full: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  confidence: 'high' | 'medium' | 'low';
  error?: string;
}

export interface AIExtractionResult {
  success: boolean;
  extracted_address: ExtractedAddress;
  error?: string;
}

/**
 * AI-powered address extraction from PDF text using OpenAI
 */
export async function callYourModel(params: { 
  prompt: string; 
  text: string; 
}): Promise<ExtractedAddress> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-extract-address', {
      body: { text: params.text }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`AI extraction failed: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'AI extraction failed');
    }

    return data.extracted_address;
  } catch (error) {
    console.error('Address extraction error:', error);
    
    // Return null result on failure
    return {
      address_full: null,
      address_line1: null,
      city: null,
      state: null,
      zip: null,
      confidence: 'low',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract address from PDF text using AI
 * Replaces any manual address detection logic
 */
export async function extractAddressFromText(text: string): Promise<string | null> {
  const ai = await callYourModel({
    prompt: "Extract property address, city, state, zip from this PDF text.",
    text,
  });
  
  const detected_address = ai.address_full || null;
  
  if (detected_address && ai.confidence !== 'low') {
    console.log(`AI extracted address with ${ai.confidence} confidence:`, detected_address);
  } else if (ai.error) {
    console.warn('Address extraction failed:', ai.error);
  } else {
    console.log('No clear address found in text');
  }
  
  return detected_address;
}

/**
 * Extract structured address components from PDF text
 */
export async function extractStructuredAddress(text: string): Promise<ExtractedAddress> {
  return await callYourModel({
    prompt: "Extract property address, city, state, zip from this PDF text.",
    text,
  });
}