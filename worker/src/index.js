/**
 * Cloudflare Worker - Receipt Splitter API Proxy
 * 
 * This worker proxies requests to Mistral AI's API, keeping the API key secure.
 * Deploy with: wrangler deploy
 * 
 * Required secrets (set via `wrangler secret put MISTRAL_API_KEY`):
 * - MISTRAL_API_KEY: Your Mistral AI API key
 */

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'pixtral-12b-latest';

// OCR Prompt - same as the Python backend
const OCR_PROMPT = `
INITIAL DETECTION - Carefully analyze if this image is ACTUALLY a receipt/bill/invoice:
- A valid receipt MUST have ALL of these elements:
* A clear list of purchased items with corresponding prices
* A structured format with items aligned in rows/columns
* A clearly marked total amount
* Usually contains business name, date, and payment information
* Consistent currency symbols (₹, $, €, etc.) before numerical values

- This is NOT a receipt if ANY of these are true:
* Contains mathematical equations, formulas, or academic notation
* Contains LaTeX or other technical/scientific symbols (σ, ∫, ∑, ≡, etc.)
* Has variables, functions, or mathematical expressions (e.g., max(F(T) - K, 0))
* Primarily consists of paragraphs of text without itemized prices
* Is a menu, poster, advertisement, or academic paper
* Lacks a clear itemized structure and total amount

If it is NOT a receipt/bill (doesn't satisfy ALL receipt criteria or matches ANY non-receipt criteria), respond with: {"is_receipt": false, "reason": "explanation"}.

If it IS a receipt/bill, extract the data with EXACTLY these requirements:
1. Items section must contain product purchases only with their FINAL prices (not MRP)
2. The final total_bill should be the actual amount paid by the customer
3. CRITICAL RULES FOR TAXES AND DISCOUNTS:
   - EXCLUDE ALL line items marked as 'FREE', 'Zero', '0', or '₹0'
   - EXCLUDE ALL 'Product discount', 'MRP discount' items - these are already factored into item prices
   - EXCLUDE delivery charges or any other fees with zero value
   - ONLY include fees, charges, and taxes that have a non-zero monetary value AND are charged on top of item prices
   - For Blinkit/grocery receipts, only include 'Handling charge' if it has a non-zero value
4. IMPORTANT - taxes array should ONLY include:
   - Service charges, handling fees, delivery fees (ONLY if they have a positive non-zero value)
   - Tax items like GST, VAT, service tax (ONLY if they have a positive non-zero value)
   - Final bill discounts (NOT product/MRP discounts) (ONLY if they have a negative non-zero value)
5. ALWAYS EXCLUDE from taxes:
   - ANY item with value of 0 or marked as FREE
   - MRP (Maximum Retail Price) information
   - 'Product discount' or any discount showing the difference between MRP and selling price
   - Item totals / subtotals
   - Any line that summarizes the order
6. Format all monetary values as plain numbers without currency symbols
7. Handle + and - correctly (e.g., discount of 45 should be -45.0)

Return a structured JSON matching this schema:
{
  "is_receipt": true,
  "reason": "",
  "file_name": "string",
  "topics": ["string"],
  "languages": ["string"],
  "ocr_contents": {
    "items": [{"name": "string", "price": number}],
    "total_order_bill_details": {
      "total_bill": number,
      "taxes": [{"name": "string", "amount": number}]
    }
  }
}
`;

// CORS headers
function corsHeaders(origin, allowedOrigin) {
    // Allow localhost for development, and the production origin
    const allowedOrigins = [allowedOrigin, 'http://localhost:3000'];
    const isAllowed = allowedOrigins.includes(origin) || origin?.startsWith('http://localhost:');

    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    };
}

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';
        const headers = corsHeaders(origin, env.ALLOWED_ORIGIN);

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers });
        }

        // Only allow POST requests
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...headers, 'Content-Type': 'application/json' },
            });
        }

        try {
            // Parse the incoming form data
            const formData = await request.formData();
            const file = formData.get('file');

            if (!file) {
                return new Response(JSON.stringify({ detail: 'No file provided' }), {
                    status: 400,
                    headers: { ...headers, 'Content-Type': 'application/json' },
                });
            }

            // Convert file to base64
            const arrayBuffer = await file.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            const mimeType = file.type || 'image/jpeg';
            const base64DataUrl = `data:${mimeType};base64,${base64}`;

            // Call Mistral AI API
            const mistralResponse = await fetch(MISTRAL_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${env.MISTRAL_API_KEY}`,
                },
                body: JSON.stringify({
                    model: MISTRAL_MODEL,
                    messages: [{
                        role: 'user',
                        content: [
                            { type: 'image_url', image_url: { url: base64DataUrl } },
                            { type: 'text', text: OCR_PROMPT },
                        ],
                    }],
                    response_format: { type: 'json_object' },
                    temperature: 0,
                }),
            });

            if (!mistralResponse.ok) {
                const errorData = await mistralResponse.text();
                console.error('Mistral API error:', errorData);
                return new Response(JSON.stringify({ detail: 'Error processing receipt with AI' }), {
                    status: 500,
                    headers: { ...headers, 'Content-Type': 'application/json' },
                });
            }

            const mistralData = await mistralResponse.json();
            const content = mistralData.choices?.[0]?.message?.content;

            if (!content) {
                return new Response(JSON.stringify({ detail: 'No response from AI' }), {
                    status: 500,
                    headers: { ...headers, 'Content-Type': 'application/json' },
                });
            }

            // Parse the JSON response
            const parsedContent = JSON.parse(content);

            // Check if it's a valid receipt
            if (!parsedContent.is_receipt) {
                return new Response(JSON.stringify({
                    detail: parsedContent.reason || "The image doesn't appear to be a valid receipt"
                }), {
                    status: 400,
                    headers: { ...headers, 'Content-Type': 'application/json' },
                });
            }

            // Add filename to response
            parsedContent.file_name = file.name || 'uploaded_receipt';

            return new Response(JSON.stringify(parsedContent), {
                status: 200,
                headers: { ...headers, 'Content-Type': 'application/json' },
            });

        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({ detail: `Error processing receipt: ${error.message}` }), {
                status: 500,
                headers: { ...headers, 'Content-Type': 'application/json' },
            });
        }
    },
};
