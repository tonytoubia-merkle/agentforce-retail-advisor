/**
 * /api/brand-research — AI-powered brand research pipeline.
 *
 * POST /api/brand-research
 * Body: { brandName: string, brandUrl?: string, vertical: string, notes?: string }
 *
 * Uses Claude to:
 *   1. Research the brand (from URL or general knowledge)
 *   2. Generate a theme (colors, typography) matching the brand
 *   3. Generate a product catalog appropriate for the vertical
 *   4. Generate customer personas for demo scenarios
 *   5. Suggest brand voice notes for agent prompt customization
 */
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const config = {
  maxDuration: 120,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { brandName, brandUrl, vertical, notes } = req.body || {};
  if (!brandName) {
    return res.status(400).json({ error: 'brandName is required' });
  }

  try {
    const result = await researchBrand({ brandName, brandUrl, vertical: vertical || 'beauty', notes });
    return res.status(200).json(result);
  } catch (err) {
    console.error('[brand-research] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function researchBrand({ brandName, brandUrl, vertical, notes }) {
  const verticalDescriptions = {
    beauty: 'skincare, cosmetics, fragrance, beauty products',
    fashion: 'apparel, accessories, luxury fashion, footwear',
    wellness: 'health supplements, wellness products, fitness gear',
    cpg: 'consumer packaged goods, food & beverage, household products',
  };

  const verticalDesc = verticalDescriptions[vertical] || verticalDescriptions.beauty;

  const systemPrompt = `You are a brand research AI that helps create demo experiences for retail brands. You analyze brands and generate structured data for demo configuration.

Your output MUST be valid JSON matching the exact schema specified. No markdown, no code fences, just raw JSON.`;

  const userPrompt = `Research the brand "${brandName}" (${verticalDesc}).
${brandUrl ? `Brand website: ${brandUrl}` : ''}
${notes ? `Additional context: ${notes}` : ''}

Generate a complete demo configuration with:

1. **Theme** — colors that match the brand's visual identity
2. **Products** — 15-20 products appropriate for this brand and vertical
3. **Personas** — 5-6 customer personas with diverse profiles for demo scenarios
4. **Brand voice** — notes on tone, style, and personality for AI agent customization

Return this exact JSON structure:
{
  "suggestedTheme": {
    "primaryColor": "#hex",
    "accentColor": "#hex",
    "backgroundColor": "#hex",
    "textColor": "#hex",
    "fontFamily": "font stack string"
  },
  "suggestedTagline": "short brand tagline for the demo",
  "products": [
    {
      "name": "Product Name",
      "brand": "${brandName}",
      "category": "one of: moisturizer|cleanser|serum|sunscreen|mask|toner|foundation|lipstick|mascara|blush|fragrance|shampoo|conditioner|hair-treatment|spot-treatment",
      "price": 49.99,
      "currency": "USD",
      "description": "Full product description",
      "shortDescription": "One line description",
      "rating": 4.5,
      "reviewCount": 128,
      "inStock": true,
      "attributes": {
        "skinType": ["dry", "normal"],
        "concerns": ["hydration", "anti-aging"],
        "keyIngredients": ["hyaluronic acid", "vitamin C"],
        "isFragranceFree": false,
        "isVegan": true,
        "isCrueltyFree": true
      }
    }
  ],
  "personas": [
    {
      "personaKey": "lowercase-id",
      "label": "Full Name",
      "subtitle": "Known · Loyalty Gold",
      "traits": ["sensitive skin", "eco-conscious", "frequent buyer"],
      "profile": {
        "id": "persona-key",
        "name": "First Name",
        "email": "email@example.com",
        "beautyProfile": {
          "skinType": "sensitive",
          "concerns": ["hydration"],
          "allergies": [],
          "fragrancePreference": "light",
          "communicationPrefs": { "email": true, "sms": true, "push": false },
          "preferredBrands": ["${brandName}"],
          "ageRange": "30-40"
        },
        "orders": [
          {
            "orderId": "ORD-2025-0001",
            "orderDate": "2025-06-12",
            "channel": "online",
            "status": "completed",
            "totalAmount": 94.00,
            "lineItems": [
              { "productId": "product-id", "productName": "Product Name", "quantity": 1, "unitPrice": 47.00 }
            ]
          }
        ],
        "chatSummaries": [],
        "meaningfulEvents": [],
        "agentCapturedProfile": {}
      }
    }
  ],
  "brandVoiceNotes": "Description of the brand's communication style, tone, personality traits, and how the AI advisor should present itself when representing this brand."
}

For the ${vertical} vertical, adjust product categories appropriately:
- Fashion: use categories like "jacket", "dress", "sneaker", "handbag", "accessory", "watch" (map to closest available)
- Wellness: use "supplement", "vitamin", "fitness-gear" etc.
- CPG: use "beverage", "snack", "household" etc.
For non-beauty verticals, adapt the persona profiles (e.g. replace beautyProfile with relevant preferences).

Ensure product prices are realistic for the brand's market position.
Make persona names diverse and realistic.
The theme colors should genuinely reflect the brand's visual identity.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

  // Parse the JSON response
  let parsed;
  try {
    // Strip any markdown code fences if Claude adds them
    const cleaned = text.replace(/^```json?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse AI response as JSON');
  }

  return {
    suggestedTheme: parsed.suggestedTheme,
    suggestedTagline: parsed.suggestedTagline,
    productSuggestions: (parsed.products || []).map((p, i) => ({
      ...p,
      images: [],
      imageUrl: '',
      retailers: [],
      sortOrder: i,
    })),
    personaSuggestions: parsed.personas || [],
    brandVoiceNotes: parsed.brandVoiceNotes || '',
  };
}
