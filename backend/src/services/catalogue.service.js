import config from '../config/env.config.js';
import { sanitizeJsonResponse } from './ai.service.js';
import { sanitizeShortEnglishTitle } from './voiceParser.service.js';

/**
 * System prompt enforcing strict anti-fabrication rules and JSON schema compliance
 */
const CATALOGUE_SYSTEM_PROMPT = `
You are the Master Multilingual E-Commerce Copywriter and Craft Documenter for KarigarAI.
Your goal is to synthesize three sources of information into an authentic, compelling, e-commerce product catalogue:
1. Visual Image Analysis (detected materials, craft type, visible characteristics, colors)
2. Voice / Text Artisan Description (spoken notes, vernacular terms, workshop context in English, Hindi, or Gujarati)
3. Product Attributes (category, base craft technique)

STRICT ANTI-FABRICATION SAFETY RULES:
1. Rely ONLY on the verified information provided in the inputs.
2. DO NOT FABRICATE unverified certifications (e.g. do NOT claim "GI Tag certified" or "Silk Mark certified" unless explicitly stated in inputs).
3. DO NOT FABRICATE geographical origin (e.g. do NOT assume "Made in Jaipur" unless specified).
4. DO NOT FABRICATE historical claims or folklore lore unless given by the artisan.
5. DO NOT FABRICATE false materials or technical specifications.
6. If an attribute is unknown, keep it authentic and faithful to the visible craft evidence.

OUTPUT SCHEMA REQUIREMENTS:
You must return ONLY a clean, valid JSON object with EXACTLY these fields:
{
  "title": "Short (2-4 words), appealing, professional e-commerce product title in English",
  "shortDescription": "1-2 sentence compelling summary for search and previews",
  "description": "2-3 well-structured paragraphs covering the craft story, material care, and artisan touch based on provided facts",
  "category": "Standard craft category",
  "material": "Verified material name or 'Unknown'",
  "craftType": "Verified craft technique or 'Unknown'",
  "keywords": ["array", "of", "relevant", "search", "keywords"],
  "tags": ["array", "of", "e-commerce", "tags"],
  "targetAudience": "Concise description of the intended buyers (e.g. Home Decor Enthusiasts, Festive Shoppers)"
}
`;

/**
 * Build prompt for catalogue generation
 * @param {object} params 
 * @returns {string}
 */
function buildCataloguePrompt({ imageAnalysis, description, attributes, outputLanguage = 'en' }) {
  const languageInstructions = {
    en: 'Produce all output fields in professional Indian English. Title must be short (2 to 4 words max) in English only.',
    hi: 'Produce title, shortDescription, description, category, material, craftType, and targetAudience in natural, elegant Hindi (हिन्दी). Keywords and tags may include both Hindi and Latin transliterated terms.',
  };

  const selectedLangInstruction = languageInstructions[outputLanguage] || languageInstructions.en;

  return `
${CATALOGUE_SYSTEM_PROMPT}

TARGET OUTPUT LANGUAGE: ${selectedLangInstruction}

INPUT DATA SOURCES:
1. Product Visual Analysis:
${JSON.stringify(imageAnalysis || {}, null, 2)}

2. Artisan Spoken / Written Description (May be in Hindi, Gujarati, or English):
"${description || 'No additional artisan audio/text provided.'}"

3. Craft Attributes:
${JSON.stringify(attributes || {}, null, 2)}

Generate the structured JSON catalogue now:
`;
}

/**
 * Fallback catalogue generator when external APIs are not configured
 * @param {object} params 
 * @returns {object}
 */
function fallbackCatalogueGenerator({ imageAnalysis = {}, description = '', attributes = {}, outputLanguage = 'en' }) {
  const rawName = attributes.name || imageAnalysis.productType || 'Artisan Handicraft';
  const category = attributes.category || imageAnalysis.category || 'Handicraft & Traditional Decor';
  const material = attributes.material || imageAnalysis.material || 'Organic Craft Material';
  const craftType = attributes.craftType || imageAnalysis.craftType || 'Traditional Crafting';
  const colors = imageAnalysis.colors || ['Natural'];

  const cleanEnglishTitle = sanitizeShortEnglishTitle(rawName, category, material);

  if (outputLanguage === 'hi') {
    return {
      title: `${material} द्वारा हस्तनिर्मित ${cleanEnglishTitle}`,
      shortDescription: `पारंपरिक कारीगरी से तैयार ${cleanEnglishTitle}, प्राकृतिक ${material} और पारंपरिक शिल्प तकनीक का सुंदर संगम।`,
      description: `यह विशेष ${cleanEnglishTitle} प्रामाणिक हस्तशिल्प परंपरा के साथ तैयार किया गया है। इसमें प्राकृतिक ${material} का उपयोग किया गया है।\n\n${description ? `कारीगर का विवरण: ${description}\n\n` : ''}यह उत्पाद टिकाऊ, पर्यावरण के अनुकूल और दैनिक उपयोग तथा उत्सव दोनों के लिए उपयुक्त है।`,
      category: category,
      material: material,
      craftType: craftType,
      keywords: [cleanEnglishTitle, craftType, material, 'हस्तशिल्प', 'भारतीय शिल्प', ...colors],
      tags: ['Handcrafted', 'MadeInIndia', 'ArtisanMade', 'EcoFriendly', ...colors],
      targetAudience: 'प्राकृतिक शिल्प और पारंपरिक भारतीय कला के पारखी'
    };
  }

  if (outputLanguage === 'gu') {
    return {
      title: `કુદરતી ${material} માંથી હાથથી બનાવેલ ${cleanEnglishTitle}`,
      shortDescription: `પરંપરાગત કારીગરી દ્વારા બનાવેલ ${cleanEnglishTitle}, સુંદર અને કુદરતી બનાવટ.`,
      description: `આ ${cleanEnglishTitle} કુદરતી ${material} માંથી ${craftType} પદ્ધતિથી પ્રેમપૂર્વક બનાવવામાં આવ્યું છે.\n\n${description ? `કારીગરની નોંધ: ${description}\n\n` : ''}પર્યાવરણને અનુકૂળ અને ટકાઉ બનાવટ.`,
      category: category,
      material: material,
      craftType: craftType,
      keywords: [cleanEnglishTitle, craftType, material, 'હાથબનાવટ', 'કારીગર'],
      tags: ['Handmade', 'ArtisanCraft', 'EcoFriendly', ...colors],
      targetAudience: 'પરંપરાગત હસ્તકળા અને ભારતીય કલા પ્રેમીઓ'
    };
  }

  // Default English Output (Short & English-Only)
  return {
    title: cleanEnglishTitle,
    shortDescription: `Skillfully handcrafted ${cleanEnglishTitle} made with natural ${material} using time-honored ${craftType} techniques.`,
    description: `This exquisite ${cleanEnglishTitle} celebrates authentic artisan craftsmanship. Built with high-grade ${material}, each piece highlights the unique visual textures created by traditional ${craftType} artisans.\n\n${description ? `Artisan's Note: ${description}\n\n` : ''}Ideal for everyday utility or thoughtful cultural gifting, bringing heritage elegance into contemporary spaces.`,
    category: category,
    material: material,
    craftType: craftType,
    keywords: [cleanEnglishTitle, craftType, material, 'Handcrafted', 'Artisan Made', ...colors],
    tags: ['Handmade', 'IndianHandicraft', 'AuthenticArtisan', 'SustainableCraft', ...colors],
    targetAudience: 'Lovers of authentic handicrafts, cultural gifting, and sustainable home living'
  };
}

/**
 * Validate and format the generated catalogue schema
 * @param {object} parsed 
 * @param {object} fallback 
 * @returns {object}
 */
function validateCatalogueSchema(parsed, fallback) {
  if (!parsed || typeof parsed !== 'object') return fallback;

  return {
    title: typeof parsed.title === 'string' && parsed.title.trim() !== '' ? parsed.title.trim() : fallback.title,
    shortDescription: typeof parsed.shortDescription === 'string' && parsed.shortDescription.trim() !== '' ? parsed.shortDescription.trim() : fallback.shortDescription,
    description: typeof parsed.description === 'string' && parsed.description.trim() !== '' ? parsed.description.trim() : fallback.description,
    category: typeof parsed.category === 'string' && parsed.category.trim() !== '' ? parsed.category.trim() : fallback.category,
    material: typeof parsed.material === 'string' && parsed.material.trim() !== '' ? parsed.material.trim() : fallback.material,
    craftType: typeof parsed.craftType === 'string' && parsed.craftType.trim() !== '' ? parsed.craftType.trim() : fallback.craftType,
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(k => String(k).trim()).filter(Boolean) : fallback.keywords,
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(t => String(t).trim()).filter(Boolean) : fallback.tags,
    targetAudience: typeof parsed.targetAudience === 'string' && parsed.targetAudience.trim() !== '' ? parsed.targetAudience.trim() : fallback.targetAudience,
  };
}

/**
 * Main AI Catalogue Generation Function
 * @param {object} payload - { imageAnalysis, description, attributes, outputLanguage }
 * @returns {Promise<{ success: boolean, catalogue: object, language: string, engine: string }>}
 */
export async function generateProductCatalogue(payload = {}) {
  const { imageAnalysis = {}, description = '', attributes = {}, outputLanguage = 'en' } = payload;
  const fallback = fallbackCatalogueGenerator({ imageAnalysis, description, attributes, outputLanguage });

  const prompt = buildCataloguePrompt({ imageAnalysis, description, attributes, outputLanguage });

  // 1. Try Gemini API
  if (config.geminiApiKey && config.geminiApiKey.trim() !== '') {
    try {
      const model = config.aiModel || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            response_mime_type: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = sanitizeJsonResponse(rawText);
        const validated = validateCatalogueSchema(parsed, fallback);

        return {
          success: true,
          catalogue: validated,
          language: outputLanguage,
          engine: 'gemini-ai-catalogue-generator',
        };
      }
    } catch (geminiErr) {
      console.warn('Gemini Catalogue Generator error, trying next:', geminiErr.message);
    }
  }

  // 2. Try OpenAI API
  if (config.openaiApiKey && config.openaiApiKey.trim() !== '') {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: CATALOGUE_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.choices?.[0]?.message?.content;
        const parsed = sanitizeJsonResponse(rawText);
        const validated = validateCatalogueSchema(parsed, fallback);

        return {
          success: true,
          catalogue: validated,
          language: outputLanguage,
          engine: 'openai-catalogue-generator',
        };
      }
    } catch (openaiErr) {
      console.warn('OpenAI Catalogue Generator error:', openaiErr.message);
    }
  }

  // 3. Fallback Heuristic Generation
  return {
    success: true,
    catalogue: fallback,
    language: outputLanguage,
    engine: 'karigar-multilingual-heuristic-generator',
  };
}

export default {
  generateProductCatalogue,
};
