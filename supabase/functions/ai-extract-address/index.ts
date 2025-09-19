import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const { text } = await req.json();
    if (!text) {
      throw new Error('Text content is required');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Extract property address information from the provided text. Return a JSON object with the following structure:
            {
              "address_full": "complete address string",
              "address_line1": "street address",
              "city": "city name",
              "state": "state name or abbreviation",
              "zip": "postal code",
              "confidence": "high/medium/low based on how clear the address information is"
            }
            If no address is found, return null for address_full and other fields.`
          },
          {
            role: 'user',
            content: `Extract the property address from this text:\n\n${text}`
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let extracted;
    try {
      extracted = JSON.parse(content);
    } catch (e) {
      // Fallback if AI doesn't return valid JSON
      extracted = {
        address_full: null,
        address_line1: null,
        city: null,
        state: null,
        zip: null,
        confidence: 'low',
        error: 'Failed to parse AI response'
      };
    }

    console.log('Address extraction result:', extracted);

    return new Response(JSON.stringify({ 
      success: true,
      extracted_address: extracted 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-extract-address function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});