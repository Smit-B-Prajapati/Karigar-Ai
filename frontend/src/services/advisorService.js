import { apiRequest } from './api.js';

/**
 * Generate intelligent client-side business advice for artisans
 */
function generateClientArtisanAdvice(question = '', productContext = {}, language = 'EN') {
  const qLower = (question || '').toLowerCase();
  const prodName = productContext?.title || 'Artisan Craft';
  const prodCat = productContext?.category || 'Handcrafted Heritage Art';
  const recPrice = productContext?.recommendedPrice || productContext?.price || 1299;
  const prodCost = productContext?.productionCost || 750;

  const isHindi = language === 'HI';
  const isGujarati = language === 'GU';

  let directAnswer = '';
  let sellingTips = [];
  let suggestedKeywords = [];
  let suggestedChannels = [];

  if (qLower.includes('website') || qLower.includes('where') || qLower.includes('कहाँ') || qLower.includes('વેબસાઇટ') || qLower.includes('ક્યાં')) {
    directAnswer = isHindi
      ? `आपके ${prodName} के लिए शीर्ष अनुशंसित ऑनलाइन बिक्री चैनल: अमेज़न कारीगर (Amazon Karigar), ओएनडीसी (ONDC Craft), एत्सी (Etsy India), और इंस्टाग्राम शॉप।`
      : isGujarati
      ? `તમારા ${prodName} માટે શ્રેષ્ઠ ઑનલાઇન વેચાણ પ્લેટફોર્મ: Amazon Karigar, ONDC Handcrafts, Etsy India અને Instagram Shop છે.`
      : `Top recommended online selling channels for your ${prodName}: Amazon Karigar, ONDC Handicrafts, Etsy India, and direct Instagram Shop orders.`;
    
    suggestedChannels = [
      { name: 'Amazon Karigar', suitability: 'Very High', commission: '8-12%' },
      { name: 'ONDC Government Craft Portal', suitability: 'Direct Fair Trade', commission: '3-5%' },
      { name: 'Etsy India (Global Exports)', suitability: 'Premium Export', commission: '6.5%' },
      { name: 'Direct WhatsApp / Instagram', suitability: 'Highest Profit', commission: '0%' }
    ];
    sellingTips = [
      'Register on Amazon Karigar using your Artisan Card / Udyam Aadhar for 0% initial listing fees.',
      'List on ONDC via local buyer apps to sell pan-India with minimal intermediary cut.',
      'Share Instagram Reels showing the authentic making process to receive direct WhatsApp prepaid orders.'
    ];
    suggestedKeywords = [`Handmade ${prodName}`, 'Authentic Indian Craft', 'Traditional Artisan Gift', 'Direct from Weaver'];
  } else if (qLower.includes('price') || qLower.includes('मूल्य') || qLower.includes('કિંમત') || qLower.includes('why')) {
    const profit = Math.max(200, recPrice - prodCost);
    directAnswer = isHindi
      ? `अनुशंसित मूल्य ₹${recPrice} आपकी लागत ₹${prodCost} को कवर करता है और ₹${profit} का उचित कारीगर लाभ सुनिश्चित करता है।`
      : isGujarati
      ? `ભલામણ કરેલ કિંમત ₹${recPrice} તમારા ઉત્પાદન ખર્ચ ₹${prodCost} ને આવરી લે છે અને તમને ₹${profit} નો ન્યાયી કારીગર નફો આપે છે.`
      : `The recommended price of ₹${recPrice} fully covers your ₹${prodCost} production cost and secures a fair artisan living wage of ₹${profit} per piece.`;

    sellingTips = [
      'Never underprice authentic manual work; genuine buyers value heritage craftsmanship over mass factory items.',
      'Offer festive bundles (e.g. 2 pieces for ₹' + Math.round(recPrice * 1.85) + ') to increase total order value.',
      'Include a signed artisan heritage certificate in each parcel to reinforce the premium valuation.'
    ];
    suggestedKeywords = ['Fair Trade Artisan', 'Authentic Handcrafted', 'Heritage Collection', 'Artisan Direct'];
  } else if (qLower.includes('photo') || qLower.includes('फ़ोटो') || qLower.includes('ફોટો')) {
    directAnswer = isHindi
      ? `अपने ${prodName} के लिए 3 आवश्यक फ़ोटो लें: स्टूडियो व्हाइट बैकड्रॉप, प्राकृतिक दिन के उजाले में कारीगरी का क्लोज़-अप, और उपयोग का दृश्य।`
      : isGujarati
      ? `તમારા ${prodName} ના 3 ફોટા લો: સ્ટુડિયો વ્હાઇટ બેકડ્રોપ, કુદરતી સૂર્યપ્રકાશમાં વિગતો અને ક્રાફ્ટ બનાવતી ક્ષણ.`
      : `Shoot 3 essential photos for your ${prodName}: clean white studio catalog shot, 45° angle texture close-up, and lifestyle shot in natural daylight.`;

    sellingTips = [
      'Use the KarigarAI AI Photo Studio to place your product on a pristine clean white infinity cove.',
      'Photograph near an open window during morning 8-10 AM for soft, diffused, shadow-free natural light.',
      'Take a 1x macro close-up of intricate hand stitches, carving, or weaves to prove authentic handmade quality.'
    ];
    suggestedKeywords = ['E-Commerce Ready Photo', 'Studio Lighting', 'Handcrafted Texture', 'Artisan Detail'];
  } else if (qLower.includes('audience') || qLower.includes('खरीदार') || qLower.includes('ગ્રાહક') || qLower.includes('who')) {
    directAnswer = isHindi
      ? `आपके ${prodName} के मुख्य खरीदार: सांस्कृतिक विरासत प्रेमी, शादी और त्योहारों के खरीदार, और पर्यावरण-अनुकूल प्राकृतिक उत्पाद पसंद करने वाले लोग।`
      : isGujarati
      ? `તમારા ${prodName} ના મુખ્ય ખરીદદારો: પરંપરાગત વારસો પસંદ કરતા ગ્રાહકો, લગ્ન-તહેવારના ખરીદદારો અને ઇકો-ફ્રેન્ડલી ગ્રાહકો છે.`
      : `Primary target buyers for your ${prodName}: Cultural heritage collectors, festive & wedding shoppers, home decor enthusiasts, and conscious eco-friendly consumers.`;

    sellingTips = [
      'Target metro urban households (Delhi, Mumbai, Bengaluru, Ahmedabad) who cherish authentic regional arts.',
      'Position items as thoughtful corporate festive gifts during Diwali, Rakshabandhan, and Navratri seasons.',
      'Highlight zero-plastic, natural organic dyes and materials in your product description.'
    ];
    suggestedKeywords = ['Festive Gifting', 'Heritage Decor', 'Eco-Friendly Handicraft', 'Traditional Indian Gift'];
  } else {
    directAnswer = isHindi
      ? `अपने ${prodName} को तेजी से बेचने के लिए इसकी प्रामाणिक शिल्प विरासत, स्टूडियो फ़ोटो और पारदर्शी मूल्य निर्धारण को प्रमुखता से दिखाएं।`
      : isGujarati
      ? `તમારા ${prodName} નું ઝડપી વેચાણ કરવા માટે તેની પરંપરાગત હસ્તકલા, સ્ટુડિયો ફોટા અને યોગ્ય ભાવ દર્શાવો.`
      : `To scale sales of your ${prodName}, emphasize its authentic ${prodCat} regional heritage, clean studio presentation, and fair-trade story.`;

    sellingTips = [
      'Record a quick 15-second mobile video showing your hands working on the craft technique.',
      'Keep ready stock during peak festival months to ensure same-day dispatch.',
      'Use the AI Copilot to generate compelling product descriptions highlighting your artisan village story.'
    ];
    suggestedKeywords = [`Handmade ${prodName}`, 'Artisan Direct', 'Authentic Indian Craft', 'Traditional Handcraft'];
  }

  return {
    directAnswer,
    channels: suggestedChannels,
    advice: {
      sellingTips,
      marketPositioning: `High-value handcrafted ${prodCat} positioned for domestic and export gifting markets.`,
      suggestedPricePoint: `₹${recPrice}`,
      targetAudience: 'Urban consumers, festive shoppers, and heritage craft enthusiasts',
      suggestedKeywords
    },
    disclaimer: isHindi
      ? 'कारीगर एआई व्यावहारिक व्यावसायिक सुझाव देता है। बिक्री वास्तविक बाज़ार मांग और गुणवत्ता पर निर्भर करती है।'
      : 'KarigarAI provides strategic artisan guidelines. Actual sales depend on product appeal, festival timing, and customer outreach.'
  };
}

/**
 * Call backend AI Business Advisor service with instant smart client fallback
 * POST /api/ai/advisor
 */
export async function getBusinessAdvice(payload, token) {
  try {
    const res = await apiRequest('/ai/advisor', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 2500,
      body: JSON.stringify(payload),
    });

    if (res && res.success && res.advice) {
      return res;
    }
  } catch (err) {
    console.warn('Backend AI Advisor unavailable, using smart artisan advisor fallback:', err.message);
  }

  // Instant Contextual Artisan Advisor Fallback
  return {
    success: true,
    engine: 'karigar-smart-artisan-advisor',
    advice: generateClientArtisanAdvice(payload.question, payload.productContext, payload.language),
  };
}

/**
 * Call backend AI Business Advisor for a specific saved product ID
 * POST /api/products/:id/advisor
 */
export async function getProductBusinessAdvice(productId, payload, token) {
  try {
    const res = await apiRequest(`/products/${productId}/advisor`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 2500,
      body: JSON.stringify(payload),
    });
    if (res && res.success && res.advice) return res;
  } catch (err) {
    console.warn('Backend product advisor unavailable, using fallback:', err.message);
  }

  return {
    success: true,
    engine: 'karigar-smart-artisan-advisor',
    advice: generateClientArtisanAdvice(payload.question, payload.productContext, payload.language),
  };
}

export default {
  getBusinessAdvice,
  getProductBusinessAdvice,
};
