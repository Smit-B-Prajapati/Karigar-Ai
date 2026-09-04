import { apiRequest } from './api.js';

/**
 * Check if Web Speech Recognition API is supported in current browser
 */
export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' && (
    'SpeechRecognition' in window ||
    'webkitSpeechRecognition' in window
  );
}

/**
 * Create and configure a browser SpeechRecognition instance
 * @param {string} language - 'en-IN' | 'hi-IN' | 'gu-IN'
 * @param {object} callbacks - { onResult, onError, onEnd, onStart }
 */
export function createSpeechRecognizer(language = 'hi-IN', callbacks = {}) {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  recognition.continuous = !isMobile;
  recognition.interimResults = true;
  recognition.lang = language;
  recognition.maxAlternatives = 1;

  if (callbacks.onStart) recognition.onstart = callbacks.onStart;
  recognition.onend = (e) => {
    if (callbacks.shouldContinue && callbacks.shouldContinue()) {
      try {
        recognition.start();
        return;
      } catch (err) {
        console.warn('[SpeechRecognition auto-restart note]:', err);
      }
    }
    if (callbacks.onEnd) {
      callbacks.onEnd(e);
    }
  };
  
  if (callbacks.onResult) {
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptChunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptChunk;
        } else {
          interimTranscript += transcriptChunk;
        }
      }

      callbacks.onResult({ finalTranscript, interimTranscript, rawEvent: event });
    };
  }

  if (callbacks.onError) {
    recognition.onerror = (event) => {
      console.warn('[Speech Recognition Event Error]:', event.error);
      callbacks.onError(event);
    };
  }

  return recognition;
}

/**
 * Call backend speech-to-text API with recorded audio buffer
 * POST /api/ai/speech-to-text
 * @param {Blob|string} audioBlobOrBase64 
 * @param {string} language 
 * @param {string} token 
 * @returns {Promise<{ success: boolean, transcript: string, language: string }>}
 */
export async function sendAudioToBackendSTT(audioBlobOrBase64, language, token) {
  try {
    let audioBase64 = audioBlobOrBase64;

    if (audioBlobOrBase64 instanceof Blob) {
      audioBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlobOrBase64);
      });
    }

    const res = await apiRequest('/ai/speech-to-text', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 2000,
      body: JSON.stringify({
        audio: audioBase64,
        language: language || 'hi-IN',
      }),
    });
    return res;
  } catch (err) {
    console.warn('Backend STT unavailable or timed out:', err.message);
    return {
      success: false,
      transcript: '',
      message: err.message,
    };
  }
}

/**
 * Map Gujarati & Devanagari numerals and vernacular spoken number words to standard ASCII digits
 */
export function normalizeNumeralsAndWords(str = '') {
  const gujDigits = { '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4', '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9' };
  const devDigits = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
  
  let s = (str || '')
    .replace(/[૦-૯]/g, d => gujDigits[d] || d)
    .replace(/[०-९]/g, d => devDigits[d] || d);
    
  // Vernacular spoken number words
  s = s.replace(/પાંચસો|पाँच सौ|पांच सौ/gi, '500')
       .replace(/સાતસો|सात सौ/gi, '700')
       .replace(/આઠસો|आठ सौ/gi, '800')
       .replace(/નવસો|नौ सौ/gi, '900')
       .replace(/હજાર|हज़ार|हजार/gi, '1000')
       .replace(/દોઢસો|डेढ़ सौ/gi, '150')
       .replace(/બસો|दो सौ/gi, '200')
       .replace(/ત્રણસો|तीन सौ/gi, '300')
       .replace(/ચારસો|चार सौ/gi, '400')
       .replace(/છસો|छह सौ/gi, '600');
  return s;
}

/**
 * Detect spoken craft color across Gujarati, Hindi, and English
 */
export function detectColor(text = '') {
  const lower = (text || '').toLowerCase();
  if (/વ્હાઈટ|વ્હાઇટ|સફેદ|ધોળો|ધોળી|ધોળું|ધોળા|सफ़ेद|सफेद|श्वेत|white|off-white|cream|ક્રીમ|क्रीम/i.test(lower)) return 'White';
  if (/લાલ|રાતો|રાતી|રાતું|લાલચટક|લાલ રંગ|लाल|red|maroon|મરૂન|मरून/i.test(lower)) return 'Red';
  if (/બ્લુ|બ્લૂ|વાદળી|ભૂરો|ભૂરી|ભૂરું|નીલ|नीला|नीली|नीले|blue|indigo|ઇન્ડિગો/i.test(lower)) return 'Blue';
  if (/લીલો|લીલી|લીલું|લીલા|હરિયો|હરિયાળો|हरा|हरी|हरे|green/i.test(lower)) return 'Green';
  if (/પીળો|પીળી|પીળું|પીળા|પીળચટો|પીળા રંગ|पीला|पीली|पीले|yellow|golden|ગોલ્ડન|સોનેરી|सुनहरा/i.test(lower)) return 'Yellow';
  if (/કાળો|કાળી|કાળું|કાળા|કાળાશ|काला|काली|काले|black/i.test(lower)) return 'Black';
  if (/ગુલાબી|પિંક|गुलाबी|pink/i.test(lower)) return 'Pink';
  if (/કેસરી|નારંગી|ભગવો|ભગવા|केसरिया|नारंगी|भगवा|orange|saffron/i.test(lower)) return 'Orange';
  if (/જાંબલી|જાંબુડીયો|बैंगनी|purple|violet/i.test(lower)) return 'Purple';
  if (/મલ્ટીકલર|મલ્ટી કલર|રંગબેરંગી|પચરંગી|બહુરંગી|रंग-बिरंगा|रंगीन|multicolor|colorful/i.test(lower)) return 'Multicolor';
  return null;
}

/**
 * Detect craft product item noun and default category/technique
 */
export function detectItem(text = '') {
  const lower = (text || '').toLowerCase();
  
  if (/ડ્રેસ|ડ્રેસનો|ડ્રેસની|ડ્રેસનું|ગાઉન|ફ્રોક|ડ્રેસિસ|ड्रेस|गाउन|फ़्रॉक|पोशाक|dress|gown|frock|outfit|attire/i.test(lower)) {
    return { noun: 'Dress', category: 'Textiles & Apparel', technique: 'Handcrafted Tailoring' };
  }
  if (/કુર્તી|કુર્તીઓ|કુર્તો|કુરતી|કુરતો|कुर्ती|कुर्ता|kurti|kurta|tunic/i.test(lower)) {
    return { noun: 'Kurti', category: 'Textiles & Apparel', technique: 'Handloom Stitching' };
  }
  if (/સાડી|સાડીઓ|સાડીની|સાડીનું|પટોળું|પટોળાં|कांजीवरम|સાડી|સડી|साड़ी|saree|sari|patola/i.test(lower)) {
    return { noun: 'Saree', category: 'Textiles & Apparel', technique: 'Handloom Weaving' };
  }
  if (/દુપટ્ટો|દુપટ્ટા|ઓઢણી|ચૂંદડી|શાલ|દુપટો|दुपट्टा|ओढ़नी|चुनरी|शॉल|dupatta|shawl|stole|scarf|chunri/i.test(lower)) {
    return { noun: 'Dupatta', category: 'Textiles & Apparel', technique: 'Handloom Weaving' };
  }
  if (/ચણિયાચોળી|ચણિયા|ચોળી|ઘાઘરો|લહેંગા|લહેંગો|लहंगा|चोली|घाघरा|lehenga|chaniya choli/i.test(lower)) {
    return { noun: 'Lehenga Choli', category: 'Textiles & Apparel', technique: 'Hand Embroidery' };
  }
  if (/સૂટ|સલવાર|સલવાર સૂટ|સૂટ|सलवार|salwar|suit/i.test(lower)) {
    return { noun: 'Salwar Suit', category: 'Textiles & Apparel', technique: 'Handcrafted Tailoring' };
  }
  if (/ટોપ|શર્ટ|टॉप|शर्ट|top|shirt/i.test(lower)) {
    return { noun: 'Artisan Top', category: 'Textiles & Apparel', technique: 'Handcrafted Tailoring' };
  }
  if (/રાખડી|રાખડીઓ|રાખી|રાખીઓ|રાખી|राखी|राखड़ी|rakhi|rakhri|rakshabandhan|रक्षाबंधन/i.test(lower)) {
    return { noun: 'Rakhi', category: 'Festive Craft', technique: 'Hand-Tied Threadwork' };
  }
  if (/દીવો|દીવડા|દીવડી|દીપક|દિવો|દિવા|दिया|दीपक|दीया|दीप|diya|lamp|deepam/i.test(lower)) {
    return { noun: 'Decorative Diya', category: 'Festive Craft', technique: 'Handcrafted Terracotta' };
  }
  if (/તોરણ|તોરણિયા|ઝુમ્મર|વોલ હેંગિંગ|तोरण|झूमर|wall hanging|toran/i.test(lower)) {
    return { noun: 'Wall Hanging', category: 'Festive Craft', technique: 'Hand Embroidery & Mirror Work' };
  }
  if (/વાસણ|કૂંજો|કૂંડી|ગુલદસ્તો|માટલું|ઘડો|ઘડી|કુંજો|કુંડી|ફૂલદાની|फूलदान|गुलदस्ता|मटका|घड़ा|गमला|vase|pot|planter|bowl|pitcher|pottery/i.test(lower)) {
    return { noun: 'Terracotta Vase', category: 'Pottery & Ceramics', technique: 'Wheel Pottery' };
  }
  if (/થેલો|થેલી|પર્સ|બેગ|ઝોળી|થોથો|થૈલો|थैला|पर्स|बैग|झोला|झोली|bag|tote|purse|pouch|handbag/i.test(lower)) {
    return { noun: 'Tote Bag', category: 'Bags & Accessories', technique: 'Handcrafted Stitching' };
  }
  if (/ચિત્ર|ચિત્રકળા|પેઇન્ટિંગ|પેન્ટિંગ|તસ્વીર|तस्वीर|पेंटिंग|चित्रकला|painting|pattachitra|madhubani|warli|pichwai|wall art/i.test(lower)) {
    return { noun: 'Folk Painting', category: 'Paintings & Folk Art', technique: 'Traditional Folk Art' };
  }
  if (/હાર|માળા|બુટ્ટી|કાપ|ઝૂમખાં|બંગડી|કડું|હારમાળા|ઝૂમકી|झुमके|झुमका|बाली|चूड़ी|कंगन|हार|माला|necklace|earrings|bangles|jhumka|jewelry|pendant/i.test(lower)) {
    return { noun: 'Artisan Jewelry', category: 'Jewelry & Metalware', technique: 'Handcrafted Metalwork' };
  }
  if (/મૂર્તિ|પૂતળું|પ્રતિમા|બાવલું|मूर्ति|प्रतिमा|idol|statue|figurine|sculpture/i.test(lower)) {
    return { noun: 'Handmade Idol', category: 'Jewelry & Metalware', technique: 'Hand Sculpting' };
  }
  if (/લાકડાનું નક્શીકામ|લાકડાની પેટી|લાકડું|લાકડા|નક્શીકામ|નકશી|wooden box|wood carving|wooden craft|artifact/i.test(lower)) {
    return { noun: 'Wooden Artifact', category: 'Wood Crafts', technique: 'Hand Carving' };
  }
  return null;
}

/**
 * Detect craft material across Gujarati, Hindi, and English
 */
export function detectMaterial(text = '', detectedItem = null) {
  const lower = (text || '').toLowerCase();
  
  if (/કોટન|કોટનથી|કોટોન|કપાસ|સુતરાઉ|સુતર|રૂ(?!પિ)|ખાદી|कॉटन|सूती|कपास|खादी|सूत|cotton|organic cotton|pure cotton|khadi/i.test(lower)) {
    const isApparel = detectedItem && detectedItem.category === 'Textiles & Apparel';
    return {
      noun: 'Cotton',
      en: isApparel ? 'Pure Cotton Fabric' : 'Pure Cotton',
      technique: isApparel ? 'Handloom Weaving' : 'Handcrafted Technique'
    };
  }
  if (/સિલ્ક|રેશમ|પટોળું|પટોળાં|તસર|ચંદેરી|सिल्क|रेशम|पटोला|silk|raw silk|mulberry silk|tussar|chanderi/i.test(lower)) {
    return {
      noun: 'Silk',
      en: 'Pure Mulberry Silk',
      technique: 'Handloom Silk Weaving'
    };
  }
  if (/માટી|માટીનો|માટીની|માટીનું|ટેરાકોટા|ચીકણી માટી|मिट्टी|टेराकोटा|clay|terracotta|ceramic/i.test(lower)) {
    return {
      noun: 'Clay',
      en: 'Natural Terracotta Clay',
      technique: 'Wheel Pottery'
    };
  }
  if (/લાકડું|લાકડા|લાકડાનો|લાકડાની|લાકડાનું|સાગ|સીસમ|શીશમ|કાષ્ઠ|लकड़ी|सागवान|शीशम|wood|wooden|teak|sheesham/i.test(lower)) {
    return {
      noun: 'Wood',
      en: 'Carved Teak Wood',
      technique: 'Hand Carving'
    };
  }
  if (/પીતળ|પીતળનો|પીતળની|તાંબુ|તાંબું|કાંસુ|કાંસું|ધાતુ|લોખંડ|लोहा|पीतल|तांबा|कांसा|धातु|brass|copper|bronze|metal/i.test(lower)) {
    return {
      noun: 'Brass',
      en: 'Solid Brass Metal',
      technique: 'Handcrafted Metalwork'
    };
  }
  if (/જૂટ|ક્ષણ|શણ|તાગડી|જૂટની|જૂટનો|जूट|पटसन|jute|burlap/i.test(lower)) {
    return {
      noun: 'Jute',
      en: 'Eco Jute Fibre',
      technique: 'Handcrafted Stitching'
    };
  }
  if (/ઊન|ઉન|ऊन|wool|pashmina|cashmere/i.test(lower)) {
    return {
      noun: 'Wool',
      en: 'Pure Handspun Wool',
      technique: 'Handloom Wool Weaving'
    };
  }
  if (/આરસ|પથ્થર|સંગમરમર|पत्थर|संगमरमर|marble|stone/i.test(lower)) {
    return {
      noun: 'Marble',
      en: 'Polished Marble Stone',
      technique: 'Stone Inlay Craft'
    };
  }
  if (/ચામડું|ચામડા|ચર્મ|ચमड़ा|leather/i.test(lower)) {
    return {
      noun: 'Leather',
      en: 'Genuine Handcrafted Leather',
      technique: 'Leather Craft'
    };
  }
  if (/કઠોળ|દાળ|બીજ|દાણા|दाल|बीज|दाने|pulses|seeds|grains/i.test(lower)) {
    return {
      noun: 'Pulse',
      en: 'Natural Pulses & Seeds',
      technique: 'Seed & Grain Attachment'
    };
  }
  if (/કાચ|મોતી|આભલા|આભલાં|ઝરી|જરદોશી|कांच|मोती|शीशा|जरी|beads|pearls|glass|mirror/i.test(lower)) {
    return {
      noun: 'Beaded',
      en: 'Mirror Work & Beads',
      technique: 'Traditional Mirror Work'
    };
  }
  return null;
}

/**
 * Detect special craft technique tags
 */
export function detectSpecialCraft(text = '') {
  const lower = (text || '').toLowerCase();
  if (/બાંધણી|બાંધણીની|બાંધણીનો|बांधणी|bandhani|tie and dye|tie-dye/i.test(lower)) {
    return { tag: 'Bandhani', technique: 'Bandhani Tie & Dye' };
  }
  if (/બ્લોક પ્રિન્ટ|અજરખ|દાબુ|अजरक|ब्लॉक प्रिंट|block print|ajrakh|batik|dabu/i.test(lower)) {
    return { tag: 'Block Print', technique: 'Traditional Block Printing' };
  }
  if (/ભરતકામ|કઢાઈ|ભરત|એમ્બ્રોઈડરી|कढ़ाई|कसीदाकारी|embroidery|embroidered|kutch work/i.test(lower)) {
    return { tag: 'Embroidered', technique: 'Hand Embroidery' };
  }
  if (/આભલાકામ|આભલા ભરત|કાચકામ|शीशा काम|mirror work|kutch mirror/i.test(lower)) {
    return { tag: 'Mirror Work', technique: 'Traditional Mirror Work' };
  }
  if (/કલમકારી|કલમકાર|कलमकारी|kalamkari/i.test(lower)) {
    return { tag: 'Kalamkari', technique: 'Hand-Painted Kalamkari' };
  }
  if (/બ્લુ પોટરી|જયપુર પોટરી|blue pottery/i.test(lower)) {
    return { tag: 'Blue Pottery', technique: 'Jaipur Blue Pottery' };
  }
  if (/ચાક|ચાકડો|ચાકડા|चाक|wheel pottery/i.test(lower)) {
    return { tag: 'Pottery', technique: 'Wheel Pottery' };
  }
  if (/નક્શીકામ|નકશી|નક્શી|नक्काशी|carving|hand carved/i.test(lower)) {
    return { tag: 'Carved', technique: 'Hand Carving' };
  }
  return null;
}

/**
 * Format title string to strictly 2 to 4 words
 */
export function formatShortTitle(titleStr) {
  const parts = titleStr.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 4) {
    if (parts.length === 5 && (parts[0] === 'Handmade' || parts[0] === 'Handcrafted')) {
      return parts.slice(1, 5).join(' ');
    }
    return parts.slice(0, 4).join(' ');
  }
  if (parts.length === 1) {
    return `Handmade ${parts[0]}`;
  }
  return parts.join(' ');
}

/**
 * Sanitize, clean and ensure that product titles are:
 * 1. Short (2 to 4 words max)
 * 2. In English ONLY (no Devanagari, Gujarati, or non-Latin script)
 * 3. Title-cased and free of filler words
 */
export function sanitizeShortEnglishTitle(rawTitle, category = 'General Craft', material = '') {
  if (!rawTitle || typeof rawTitle !== 'string') {
    return generateEnglishCraftTitle('', category, material);
  }

  // Remove non-ASCII characters (Devanagari, Gujarati, symbols)
  let asciiOnly = rawTitle.replace(/[^\x20-\x7E]/g, ' ').trim();

  // Strip common punctuation
  asciiOnly = asciiOnly.replace(/[,/#!$%^&*;:{}=\-_`~()?"'<>]/g, ' ');

  // Filter out filler words and stopwords
  const stopWords = new Set([
    'is', 'are', 'a', 'an', 'the', 'for', 'to', 'with', 'made', 'attached', 'added',
    'selling', 'price', 'cost', 'rupees', 'rs', 'inr', 'and', 'by', 'of', 'from',
    'at', 'on', 'it', 'this', 'my', 'our', 'we', 'target', 'category', 'material',
    'technique', 'please', 'item', 'product', 'have', 'has', 'in', 'as'
  ]);

  const words = asciiOnly
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 1 && !stopWords.has(w.toLowerCase()));

  // If we have 2 to 4 valid English words, format them nicely
  if (words.length >= 2) {
    const titleWords = words.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    const joined = titleWords.join(' ');
    // Ensure prefix if short
    if (titleWords.length <= 2 && !/handmade|handcrafted|artisan|pure|organic|jaipur|kutch/i.test(joined)) {
      return `Handmade ${joined}`;
    }
    return formatShortTitle(joined);
  } else if (words.length === 1) {
    const single = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
    return `Handmade ${single}`;
  }

  // If no valid English words remained (e.g. pure Hindi/Gujarati text), generate from context
  return generateEnglishCraftTitle(rawTitle, category, material);
}

/**
 * Generate a clean 2 to 4 word English title by inspecting spoken text, category, and material
 */
export function generateEnglishCraftTitle(text = '', category = 'Festive Craft', material = '') {
  const detectedColor = detectColor(text);
  const detectedItem = detectItem(text);
  const detectedMat = detectMaterial(text, detectedItem);
  const detectedSpecial = detectSpecialCraft(text);

  if (detectedItem) {
    const itemNoun = detectedItem.noun;
    const color = detectedColor;
    const matNoun = detectedMat ? detectedMat.noun : (material ? material.split(' ')[0] : '');
    const specialTag = detectedSpecial ? detectedSpecial.tag : '';

    // 1. Color + Material + Item (e.g. "Handmade White Cotton Dress")
    if (color && matNoun) {
      return formatShortTitle(`Handmade ${color} ${matNoun} ${itemNoun}`);
    }
    // 2. Special tag + Color + Item (e.g. "Handcrafted Blue Bandhani Saree")
    if (specialTag && color) {
      return formatShortTitle(`Handcrafted ${color} ${specialTag} ${itemNoun}`);
    }
    // 3. Special tag + Material + Item (e.g. "Pure Silk Bandhani Dupatta")
    if (specialTag && matNoun) {
      return formatShortTitle(`Handmade ${matNoun} ${specialTag} ${itemNoun}`);
    }
    if (specialTag) {
      return formatShortTitle(`Handmade ${specialTag} Artisan ${itemNoun}`);
    }
    // 4. Color + Item (e.g. "Handcrafted White Artisan Dress")
    if (color) {
      return formatShortTitle(`Handcrafted ${color} Artisan ${itemNoun}`);
    }
    // 5. Material + Item (e.g. "Handcrafted Pure Cotton Dress")
    if (matNoun) {
      return formatShortTitle(`Handcrafted Pure ${matNoun} ${itemNoun}`);
    }
    // 6. Item only (e.g. "Handmade Artisan Dress")
    return formatShortTitle(`Handmade Artisan ${itemNoun}`);
  }

  // If material and color without explicit item
  if (detectedMat && detectedColor) {
    return formatShortTitle(`Handmade ${detectedColor} ${detectedMat.noun} Craft`);
  }
  if (detectedMat) {
    return formatShortTitle(`Handcrafted Pure ${detectedMat.noun} Craft`);
  }

  // Category-driven fallback short English titles
  const catLower = (category || '').toLowerCase();
  if (catLower.includes('festiv')) return 'Handmade Festive Craft';
  if (catLower.includes('pottery') || catLower.includes('ceramic')) return 'Handcrafted Pottery Vase';
  if (catLower.includes('textile') || catLower.includes('apparel')) return 'Handwoven Artisan Textile';
  if (catLower.includes('wood')) return 'Hand-Carved Wooden Artifact';
  if (catLower.includes('bag')) return 'Handmade Artisan Bag';
  if (catLower.includes('paint') || catLower.includes('folk')) return 'Handmade Folk Art Painting';
  if (catLower.includes('jewel') || catLower.includes('metal')) return 'Handmade Brass Jewelry';

  return 'Handcrafted Artisan Product';
}

/**
 * Call backend to parse voice transcript into structured form fields,
 * with smart client-side fallback parsing if offline/network fails.
 * @param {string} transcript 
 * @param {string} language 
 * @param {string} token 
 */
export async function parseVoiceTranscript(transcript, language = 'hi-IN', token = '') {
  if (!transcript || !transcript.trim()) {
    return {
      success: false,
      message: 'Empty transcript provided'
    };
  }

  try {
    const res = await apiRequest('/ai/parse-voice-fields', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 2000,
      body: JSON.stringify({
        transcript: transcript.trim(),
        language
      }),
    });

    if (res.success && res.extracted) {
      if (res.extracted.name) {
        res.extracted.name = sanitizeShortEnglishTitle(
          res.extracted.name,
          res.extracted.category,
          res.extracted.material
        );
      }
      return res;
    }
  } catch (err) {
    console.warn('Backend parse-voice-fields call failed, using client fallback:', err.message);
  }

  // Client-side Entity Extraction Engine Fallback
  return {
    success: true,
    extracted: fallbackClientEntityExtraction(transcript, language),
    engine: 'client-entity-extraction-fallback'
  };
}

function fallbackClientEntityExtraction(text, language) {
  const normalizedText = normalizeNumeralsAndWords(text);
  const lower = normalizedText.toLowerCase();

  // 1. Extract Numbers for Price & Cost (handling Gujarati, Devanagari, and English numerals)
  const priceMatches = normalizedText.match(/(?:price|selling|cost|bechna|keemat|bhav|rupees|rs\.?|₹|રૂપિયા|રુપિયા|रुपये|कीमत|ભાવ|भाव|दाम)\s*(?:is|h|hai|che|:|=|for)?\s*(\d+)/i) 
    || normalizedText.match(/(\d+)\s*(?:rupees|rs\.?|₹|રૂપિયા|રુપિયા|रुपये|रूपये)/i)
    || normalizedText.match(/\b(\d{3,5})\b/);
  const price = priceMatches ? priceMatches[1] : '750';

  const costMatches = normalizedText.match(/(?:material|kaccha|raw|laagat|lagat|banaavat|kharach|ખર્ચ|લાગત|लागत|खर्च)\s*(?:cost|price|kharach|keemat|ખર્ચ|लागत|खर्च)?\s*(?:is|h|hai|che|:|=|of|ki|ka)?\s*(\d+)/i)
    || normalizedText.match(/(\d+)\s*(?:material cost|laagat|lagat|ખર્ચ|લાગત|लागत|खर्च)/i);
  const materialCost = costMatches ? costMatches[1] : '450';

  // 2. Multilingual Attribute Entity Detection
  const detectedColor = detectColor(text);
  const detectedItem = detectItem(text);
  const detectedMat = detectMaterial(text, detectedItem);
  const detectedSpecial = detectSpecialCraft(text);

  // 3. Category Resolution (Strict & Accurate)
  let category = 'Festive Craft';
  if (detectedItem && detectedItem.category) {
    category = detectedItem.category;
  } else if (detectedMat && (detectedMat.noun === 'Cotton' || detectedMat.noun === 'Silk' || detectedMat.noun === 'Wool')) {
    category = 'Textiles & Apparel';
  } else if (detectedMat && detectedMat.noun === 'Clay') {
    category = 'Pottery & Ceramics';
  } else if (detectedMat && detectedMat.noun === 'Brass') {
    category = 'Jewelry & Metalware';
  } else if (detectedMat && detectedMat.noun === 'Jute') {
    category = 'Bags & Accessories';
  } else if (detectedMat && detectedMat.noun === 'Wood') {
    category = 'Wood Crafts';
  } else if (/silk|saree|dupatta|cotton|handloom|cloth|kapda|textile|dress|kurti|suit|કપડાં|ડ્રેસ|કુર્તી|સાડી|दुपट्टा|साड़ी|ड्रेस/i.test(lower)) {
    category = 'Textiles & Apparel';
  } else if (/clay|terracotta|pottery|ghada|matka|vase|mitti|માટી|વાસણ|ગુલદસ્તો|કુંજો/i.test(lower)) {
    category = 'Pottery & Ceramics';
  } else if (/wood|carv|lakdi|furniture|teak|લાકડું|लकड़ी|નક્શી/i.test(lower)) {
    category = 'Wood Crafts';
  } else if (/bag|tote|purse|pouch|leather|થેલો|बैग|झोला/i.test(lower)) {
    category = 'Bags & Accessories';
  } else if (/painting|folk|pattachitra|madhubani|art|ચિત્રકળા|चित्रकला|पेंटिंग/i.test(lower)) {
    category = 'Paintings & Folk Art';
  } else if (/jewelry|jewel|metal|brass|silver|gold|દાગીના|गहने|પીતળ/i.test(lower)) {
    category = 'Jewelry & Metalware';
  }

  // Explicit category voice prompt match (e.g. "category is X")
  const explicitCategoryMatch = text.match(/category\s+is\s+([a-z\s&]+?)(?=\.|$|,)/i);
  if (explicitCategoryMatch) {
    const matchedCategoryStr = explicitCategoryMatch[1].trim().toLowerCase();
    if (matchedCategoryStr.includes('festiv')) category = 'Festive Craft';
    else if (matchedCategoryStr.includes('textile') || matchedCategoryStr.includes('apparel')) category = 'Textiles & Apparel';
    else if (matchedCategoryStr.includes('wood')) category = 'Wood Crafts';
    else if (matchedCategoryStr.includes('bag')) category = 'Bags & Accessories';
    else if (matchedCategoryStr.includes('paint') || matchedCategoryStr.includes('art')) category = 'Paintings & Folk Art';
    else if (matchedCategoryStr.includes('jewel') || matchedCategoryStr.includes('metal')) category = 'Jewelry & Metalware';
    else if (matchedCategoryStr.includes('pottery') || matchedCategoryStr.includes('ceramic')) category = 'Pottery & Ceramics';
  }

  // 4. Material Resolution
  let material = 'Artisan Craft Material';
  if (detectedMat && detectedMat.en) {
    material = detectedMat.en;
  } else if (/cotton|kapas|કોટન|સુતરાઉ|कपास|कॉटन|सूती/i.test(lower)) {
    material = category === 'Textiles & Apparel' ? 'Pure Cotton Fabric' : 'Pure Cotton';
  } else if (/silk|resham|સિલ્ક|રેશમ|सિલ્ક|रेशम/i.test(lower)) {
    material = 'Pure Mulberry Silk';
  } else if (/clay|terracotta|mitti|માટી|मिट्टी/i.test(lower)) {
    material = 'Natural Terracotta Clay';
  } else if (/brass|pittal|પીતળ|पीतल/i.test(lower)) {
    material = 'Solid Brass Metal';
  } else if (/wood|teak|lakdi|લાકડું|लकड़ी/i.test(lower)) {
    material = 'Carved Teak Wood';
  } else if (/jute|જૂટ|जूट/i.test(lower)) {
    material = 'Eco Jute Fibre';
  }

  // 5. Craft Technique Resolution
  let craftType = 'Handcrafted Technique';
  if (detectedSpecial && detectedSpecial.technique) {
    craftType = detectedSpecial.technique;
  } else if (detectedItem && detectedItem.technique) {
    craftType = detectedItem.technique;
  } else if (detectedMat && detectedMat.technique) {
    craftType = detectedMat.technique;
  }

  // 4. Short & English-Only Product Title Generation
  const name = generateEnglishCraftTitle(text, category, material);

  return {
    name,
    category,
    material,
    craftType,
    price,
    materialCost,
    description: text
  };
}

export default {
  isSpeechRecognitionSupported,
  createSpeechRecognizer,
  sendAudioToBackendSTT,
  parseVoiceTranscript,
  sanitizeShortEnglishTitle,
  generateEnglishCraftTitle
};

