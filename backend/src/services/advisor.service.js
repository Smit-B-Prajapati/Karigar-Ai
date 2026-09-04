import config from '../config/env.config.js';
import { sanitizeJsonResponse } from './ai.service.js';

const ADVISOR_SYSTEM_PROMPT = `
You are the AI Business Advisor for KarigarAI, a dedicated e-commerce & marketing guide for Indian handicraft artisans.
Your goal is to provide practical, realistic, and actionable advice to help artisans present, position, and sell their products effectively.

CRITICAL MANDATORY ETHICAL & ACCURACY RULES:
1. DO NOT MAKE UNREALISTIC GUARANTEES.
2. NEVER SAY OR IMPLY "You will definitely earn ₹X", "Guaranteed ₹10,000 profit", or make any specific income promises.
3. DO NOT MAKE UNSUPPORTED CLAIMS (e.g. do NOT invent GI tag certifications, fake geographical origin, or false material properties).
4. Advice must be practical, honest, easy to understand, and actionable for traditional Indian artisans.
5. Incorporate provided product context (title, description, category, price, material, craft, tags, image analysis) directly into your advice.

OUTPUT SCHEMA REQUIREMENTS:
Return ONLY a valid JSON object with the following structure:
{
  "directAnswer": "Clear, encouraging, concise 2-3 sentence answer directly addressing the artisan's exact question.",
  "advice": {
    "betterTitle": {
      "suggestedTitle": "Optimized e-commerce title with craft and material clarity",
      "reason": "Brief explanation of why this title attracts buyers"
    },
    "keywords": ["5-8 high-intent search terms"],
    "pricingSuggestions": {
      "strategy": "Value-based pricing positioning (e.g. premium handcrafted vs entry gift)",
      "framing": "How to explain cost breakdown & craft value without earnings guarantees"
    },
    "targetAudience": ["2-3 specific buyer groups (e.g. Eco-conscious home decorators, Heritage souvenir collectors)"],
    "festivalPositioning": {
      "festivals": ["Diwali", "Navratri", "Raksha Bandhan", "Weddings"],
      "pitch": "How to position this product during festive shopping seasons"
    },
    "giftingPositioning": {
      "giftingOccasions": ["Corporate Gifting", "Housewarming", "Return Gifts"],
      "packagingTip": "Practical gifting presentation tip (e.g. artisan story tag, potli pouch)"
    },
    "photographyTips": [
      "2-3 clear tips on lighting, backdrop, close-up details, or lifestyle staging"
    ],
    "descriptionTips": [
      "2-3 actionable guidelines to improve product description and craft story"
    ],
    "sellingTips": [
      "2-3 practical tips on bundles, social media reels, or market stall display"
    ]
  },
  "disclaimer": "AI Business Advisor recommendations are strategic guidelines. Sales depend on market demand, product quality, and marketing efforts. KarigarAI does not guarantee specific earnings."
}
`;

/**
 * Build LLM prompt for AI Business Advisor
 */
function buildAdvisorPrompt({ question, productContext = {}, conversationHistory = [], language = 'EN' }) {
  const {
    name = 'Handicraft Item',
    title = '',
    description = '',
    category = 'General Craft',
    price = 0,
    material = 'Handcrafted Material',
    craftType = 'Artisan Craft',
    tags = [],
    imageAnalysis = null,
  } = productContext;

  const productTitle = title || name;
  const isHindi = language === 'HI' || /[\u0900-\u097F]/.test(question);

  return `
${ADVISOR_SYSTEM_PROMPT}

ARTISAN QUESTION:
"${question || 'How can I sell this product better?'}"

PRODUCT CONTEXT PROVIDED:
- Title: ${productTitle}
- Description: ${description || 'Not provided'}
- Category: ${category}
- Current Selling Price: ₹${price}
- Material: ${material || 'Not specified'}
- Craft Technique: ${craftType || 'Not specified'}
- Tags: ${Array.isArray(tags) ? tags.join(', ') : 'None'}
- Image Analysis: ${imageAnalysis ? JSON.stringify(imageAnalysis) : 'No visual analysis attached'}

${conversationHistory.length > 0 ? `PREVIOUS CONVERSATION IN SESSION:\n${JSON.stringify(conversationHistory.slice(-4))}` : ''}

${isHindi ? `
CRITICAL LANGUAGE REQUIREMENT:
The user interface language is HINDI (हिन्दी).
Please output all JSON string values ("directAnswer", "suggestedTitle", "reason", "keywords", "strategy", "framing", "targetAudience", "pitch", "packagingTip", "photographyTips", "descriptionTips", "sellingTips") in natural, polite, motivating Hindi (Devanagari script), keeping platform and marketplace names recognizable (e.g. Etsy, Amazon, Instagram, WhatsApp).
` : ''}

Generate structured JSON business advice now:
`;
}

/**
 * Heuristic fallback generator when AI APIs are unavailable
 * Provides rich, deeply contextual business advice tailored to the exact question in EN or HI
 */
function heuristicAdvisorFallback({ question = '', productContext = {}, language = 'EN' }) {
  const title = productContext.title || productContext.name || 'Handcrafted Craft Item';
  const category = productContext.category || 'Handicrafts & Decor';
  const material = productContext.material || 'Handcrafted Material';
  const craft = productContext.craftType || 'Artisan Craft';
  const price = productContext.price || 500;
  const tags = Array.isArray(productContext.tags) && productContext.tags.length > 0 ? productContext.tags : ['Handmade', 'IndianCraft', 'Artisan'];

  const lowerQ = (question || '').toLowerCase().trim();
  const isHindi = language === 'HI' || /[\u0900-\u097F]/.test(question);

  let directAnswer = isHindi
    ? `अपने ${title} को सफलतापूर्वक बेचने के लिए, इसकी प्रामाणिक ${craft} विरासत को रेखांकित करें, शुद्ध सफेद पृष्ठभूमि पर उच्च-कंट्रास्ट स्टूडियो फ़ोटो का उपयोग करें, और वास्तविक ${material} शिल्प कौशल की तलाश करने वाले सांस्कृतिक और पर्यावरण-अनुकूल खरीदारों को लक्षित करें।`
    : `To sell your ${title} successfully, highlight its authentic ${craft} heritage, use high-contrast studio photos on pure white backgrounds, and target cultural and eco-friendly buyers looking for genuine ${material} craftsmanship.`;

  let specificKeywords = isHindi
    ? [title, craft, material, `${category} ऑनलाइन`, 'भारतीय हस्तशिल्प', 'कारीगर हस्तनिर्मित', 'पर्यावरण अनुकूल शिल्प', 'प्रामाणिक विरासत', ...tags]
    : [title, craft, material, `${category} online`, 'Indian handicraft', 'Artisan handmade', 'Eco friendly craft', 'Authentic Indian heritage', ...tags];

  let sellingTips = isHindi
    ? [
        'इंस्टाग्राम रील्स और यूट्यूब शॉर्ट्स के लिए अपने हाथों से उत्पाद बनाने की 15-सेकंड की प्रोसेस रील वीडियो रिकॉर्ड करें।',
        'औसत ऑर्डर मूल्य बढ़ाने और आकर्षक उपहार सेट पेश करने के लिए मिलते-जुलते पूरक उत्पादों का बंडल बनाएं।',
        'राज्य शिल्प प्रदर्शनियों (जैसे दस्तकार, हुनर हाट, सरस मेला) में भाग लें और आगंतुकों के साथ अपने ऑनलाइन कैटलॉग का QR कोड साझा करें।'
      ]
    : [
        'Record a 15-second process video showing your hands crafting the item for Instagram Reels & YouTube Shorts.',
        'Bundle complementary items together to offer gift sets and increase average order value.',
        'Participate in state craft exhibitions (e.g. Dastkar, Hunar Haat, Saras Mela) and share your online catalogue QR code with visitors.'
      ];

  let photographyTips = isHindi
    ? [
        'सटीक और जीवंत रंग दिखाने के लिए खिड़की के पास सुबह की सौम्य और अप्रत्यक्ष प्राकृतिक धूप में फ़ोटो लें।',
        `बारीक ${craft} बनावट और हस्तनिर्मित बुनाई/नक्काशी विवरण को स्पष्ट रूप से दर्शाने के लिए 2x मैक्रो क्लोज़-अप तस्वीर लें।`,
        'उत्पाद को किसी आधुनिक घर में या पारंपरिक पोशाक के साथ प्रदर्शित करते हुए लाइफस्टाइल संदर्भ फ़ोटो जोड़ें।'
      ]
    : [
        'Capture the product under soft, indirect natural morning daylight near a window to showcase true vibrant colors.',
        `Take a macro close-up photo highlighting the delicate ${craft} texture and handmade weave/carving details.`,
        'Include a lifestyle context photo showing how the item looks in a modern living space or paired with traditional attire.'
      ];

  let descriptionTips = isHindi
    ? [
        `अपने ${material} की प्रामाणिकता और स्रोत का विवरण दें कि यह आपके ${title} को टिकाऊ, अद्वितीय और पर्यावरण-अनुकूल कैसे बनाता है।`,
        'ऑनलाइन खरीदारों को वास्तविक आकार समझने में मदद करने के लिए सटीक माप (लंबाई, चौड़ाई, वजन) शामिल करें।',
        'ग्राहकों का विश्वास मजबूत करने के लिए आसान देखभाल और रखरखाव निर्देश (उदा. मुलायम सूती कपड़े से साफ़ करें) जोड़ें।'
      ]
    : [
        `Detail the origin of your ${material} and why it makes this ${title} durable, sustainable, and unique.`,
        'Include exact physical dimensions (length, height, weight) to help online buyers visualize the scale accurately.',
        'Add simple care and maintenance instructions (e.g. dry wipe with soft cotton cloth) to build customer trust.'
      ];

  let pricingStrategy = isHindi
    ? `₹${price} का वर्तमान मूल्य इसे एक सुलभ और व्यावहारिक कारीगर खंड में रखता है। बिना किसी अनावश्यक छूट के मूल्य को सही ठहराने के लिए कच्चे माल की शुद्धता और निर्माण घंटों को प्रमुखता से दिखाएं।`
    : `Current price of ₹${price} places this in an approachable artisan segment. Highlight raw material purity and creation hours to justify value without discounting.`;

  let pricingFraming = isHindi
    ? `मूल्य स्तर बनाएं: एकल उत्पाद @ ₹${price}, या मानार्थ हस्तनिर्मित पोटली पाउच के साथ 2 का त्योहारी उपहार सेट @ ₹${Math.round(price * 1.85)}।`
    : `Create value tiers: Single piece @ ₹${price}, or festive Gift Set of 2 @ ₹${Math.round(price * 1.85)} with a complimentary handcrafted potli pouch.`;

  let targetAudience = isHindi
    ? [
        'शहरी गृहस्वामी जो अपने घरों के लिए प्रामाणिक, पारंपरिक आंतरिक सज्जा और शिल्प सौंदर्य की तलाश में हैं',
        'सांस्कृतिक और विरासत प्रेमी जो वास्तविक हस्तनिर्मित भारतीय स्मृति चिन्ह पसंद करते हैं',
        'पर्यावरण-सचेत खरीदार और कॉर्पोरेट ग्राहक जो त्योहारी सम्मान उपहार खरीदते हैं'
      ]
    : [
        'Urban homeowners seeking authentic, traditional interior decor and craft aesthetics',
        'Cultural and heritage enthusiasts looking for genuine handcrafted souvenirs',
        'Eco-conscious shoppers and corporate clients purchasing festive appreciation gifts'
      ];

  let festivalPitch = isHindi
    ? `दिवाली, नवरात्रि और विवाह समारोहों के दौरान एक सदाबहार त्योहारी उपहार के रूप में प्रस्तुत करें जो घरों में शुभ पारंपरिक गर्माहट और सांस्कृतिक प्रामाणिकता लाता है।`
    : `Position as a timeless festive token during Diwali, Navratri, and wedding celebrations that brings auspicious traditional warmth and cultural authenticity into homes.`;

  let giftingTip = isHindi
    ? `एक मुद्रित कारीगर हस्ताक्षर कार्ड जोड़ें जिसमें अपना परिचय (कारीगर के रूप में) और इस कृति को तैयार करने में लगे कुशल ${craft} काम के घंटों का विवरण हो।`
    : `Include a printed artisan signature card introducing yourself (the Karigar), detailing the hours of skilled ${craft} work poured into the piece.`;

  // --- QUESTION INTENT MATCHING ---

  // 1. Where to sell / Websites / Platforms
  if (
    lowerQ.includes('website') || 
    lowerQ.includes('platform') || 
    lowerQ.includes('where to sell') || 
    lowerQ.includes('where can i sell') || 
    lowerQ.includes('online store') || 
    lowerQ.includes('amazon') || 
    lowerQ.includes('etsy') || 
    lowerQ.includes('meesho') || 
    lowerQ.includes('flipkart') || 
    lowerQ.includes('marketplace') ||
    lowerQ.includes('वेबसाइट') ||
    lowerQ.includes('कहाँ बेच') ||
    lowerQ.includes('कहा बेच') ||
    lowerQ.includes('प्लेटफ़ॉर्म') ||
    lowerQ.includes('ऑनलाइन')
  ) {
    if (isHindi) {
      directAnswer = `आपके ${title} के लिए शीर्ष अनुशंसित ऑनलाइन बिक्री चैनल:`;
      sellingTips = [
        'Etsy India: अंतरराष्ट्रीय और प्रवासी भारतीय (NRI) खरीदारों के लिए सर्वोत्तम जो 2-3 गुना प्रीमियम मूल्य देने को तैयार हैं।',
        'Amazon Karigar / Flipkart Samarth: कारीगरों के लिए रियायती विक्रेता शुल्क के साथ व्यापक राष्ट्रीय पहुंच के लिए आदर्श।',
        'iTokri और Jaypore: समर्पित पारंपरिक भारतीय शिल्प प्रेमियों और कला पारखी ग्राहकों के लिए सबसे उपयुक्त।',
        'WhatsApp Business और Instagram: शून्य प्रतिशत कमीशन और सीधे त्वरित UPI भुगतान के साथ व्यक्तिगत बिक्री के लिए सर्वोत्तम।'
      ];
      specificKeywords = ['Etsy Indian craft', 'Amazon Karigar', 'Buy Indian handicrafts online', craft, material, 'हस्तशिल्प ऑनलाइन', 'भारतीय शिल्प'];
    } else {
      directAnswer = `Top recommended online channels for your ${title}:`;
      sellingTips = [
        'Etsy India: Best for international & NRI buyers willing to pay premium prices (2-3x).',
        'Amazon Karigar / Flipkart Samarth: Best for massive national reach with discounted artisan seller fees.',
        'iTokri & Jaypore: Best for dedicated Indian craft enthusiasts and curated buyers.',
        'WhatsApp Business & Instagram: Best for direct sales with 0% commission and instant UPI payments.'
      ];
      specificKeywords = ['Etsy Indian craft', 'Amazon Karigar', 'Buy Indian handicrafts online', craft, material];
    }
  }

  // 2. Pricing, Profit, Costs & Margin
  else if (
    lowerQ.includes('price') || 
    lowerQ.includes('cost') || 
    lowerQ.includes('earn') || 
    lowerQ.includes('profit') || 
    lowerQ.includes('discount') || 
    lowerQ.includes('margin') || 
    lowerQ.includes('how much') ||
    lowerQ.includes('why should i sell') ||
    lowerQ.includes('मूल्य') ||
    lowerQ.includes('दाम') ||
    lowerQ.includes('कीमत') ||
    lowerQ.includes('लागत') ||
    lowerQ.includes('मुनाफा') ||
    lowerQ.includes('लाभ') ||
    lowerQ.includes('कमाई') ||
    lowerQ.includes('अनुशंसित')
  ) {
    const prodCost = productContext.productionCost || Math.round(price * 0.7);
    const recPrice = productContext.recommendedPrice || price;
    const mktRange = productContext.marketRange || (isHindi ? 'प्रतिस्पर्धी बाज़ार सीमा' : 'competitive marketplace range');
    const profit = Math.max(0, recPrice - prodCost);
    const margin = recPrice > 0 ? Math.round((profit / recPrice) * 100) : 30;

    if (isHindi) {
      directAnswer = `आपके ${title} के लिए मूल्य निर्धारण और लाभ विवरण:`;
      sellingTips = [
        `उत्पादन लागत आधार: आधारभूत उत्पादन लागत ₹${prodCost.toLocaleString('en-IN')} है।`,
        `अनुशंसित मूल्य: ₹${recPrice.toLocaleString('en-IN')} पर आपको उचित ${margin}% कारीगर मार्जिन (+₹${profit.toLocaleString('en-IN')} शुद्ध लाभ) मिलता है।`,
        `बाज़ार तुलना: यह वर्तमान ${mktRange} के पूर्णतः संतुलित है।`,
        'शिल्प का महत्व: बिना किसी अनावश्यक छूट के उचित मूल्य पाने के लिए लिस्टिंग में हस्तनिर्मित घंटों का उल्लेख करें।'
      ];
      specificKeywords = [`${title} price`, 'हस्तनिर्मित शिल्प', 'उचित मूल्य हस्तशिल्प', craft, material];
    } else {
      directAnswer = `Pricing breakdown for your ${title}:`;
      sellingTips = [
        `Cost Foundation: Base production cost is ₹${prodCost.toLocaleString('en-IN')}.`,
        `Recommended Price: ₹${recPrice.toLocaleString('en-IN')} delivers a fair ${margin}% artisan margin (+₹${profit.toLocaleString('en-IN')} net profit).`,
        `Market Benchmark: Aligns with ${mktRange}.`,
        'Craft Defense: Detail the authentic handcraft hours in your listing to justify value without discounting.'
      ];
      specificKeywords = [`${title} price`, 'Handmade craft gift', craft, material];
    }
  }

  // 3. Photography & Visuals
  else if (
    lowerQ.includes('photo') || 
    lowerQ.includes('picture') || 
    lowerQ.includes('image') || 
    lowerQ.includes('camera') || 
    lowerQ.includes('video') || 
    lowerQ.includes('shoot') || 
    lowerQ.includes('background') ||
    lowerQ.includes('तस्वीर') ||
    lowerQ.includes('फ़ोटो') ||
    lowerQ.includes('फोटो') ||
    lowerQ.includes('कैमरा')
  ) {
    if (isHindi) {
      directAnswer = `आपके ${title} के लिए पेशेवर फ़ोटो दिशानिर्देश:`;
      sellingTips = [
        'मुख्य तस्वीर: शुद्ध सफेद (#FFFFFF) स्टूडियो बैकग्राउंड पर 1:1 वर्गाकार साफ़ तस्वीर लें।',
        `क्लोज़-अप डिटेल: 2x मैक्रो क्लोज़-अप लें जिससे ${craft} की बारीक कारीगरी और ${material} की प्राकृतिक बनावट दिखे।`,
        'प्राकृतिक रोशनी: खिड़की के पास सुबह की सौम्य धूप में तस्वीर लें; सीधे और कठोर फ़्लैश से बचें।'
      ];
      specificKeywords = [`${craft} photo`, `${material} handmade`, title, 'क्राफ्ट फ़ोटो', 'हस्तशिल्प तस्वीर'];
    } else {
      directAnswer = `Photo guidelines for your ${title}:`;
      sellingTips = [
        'Main Photo: Clean 1:1 square on pure studio white (#FFFFFF) background.',
        `Detail Shot: 2x macro close-up showing the intricate ${craft} texture and material grain.`,
        'Lighting: Shoot under soft indirect daylight near a window; avoid harsh direct flash.'
      ];
      specificKeywords = [`${craft} photo`, `${material} handmade`, title];
    }
  }

  // 4. Increase Sales / Sell better
  else if (
    lowerQ.includes('बिक्री') ||
    lowerQ.includes('सेल') ||
    lowerQ.includes('बढ़ा') ||
    lowerQ.includes('how can i sell') ||
    lowerQ.includes('sell better') ||
    lowerQ.includes('increase sale')
  ) {
    if (isHindi) {
      directAnswer = `अपने ${title} की बिक्री में वृद्धि करने के लिए 3 त्वरित रणनीतियाँ:`;
      sellingTips = [
        'प्रोसेस रील बनाएं: Instagram Reels और YouTube Shorts के लिए अपने हाथों से शिल्प बनाते हुए 15 सेकंड का वीडियो साझा करें।',
        'उपहार बंडल ऑफर: औसत ऑर्डर मूल्य बढ़ाने के लिए 2 पूरक उत्पादों का आकर्षक गिफ्ट सेट पेश करें।',
        'शिल्प प्रदर्शनियां: दस्तकार, हुनर हाट और स्थानीय क्राफ्ट मेलों में भाग लें और आगंतुकों को अपना ऑनलाइन QR कोड कैटलॉग दिखाएं।'
      ];
      specificKeywords = [`${title} ऑनलाइन बिक्री`, 'हस्तशिल्प बिक्री', craft, material, 'कारीगर बाज़ार'];
    } else {
      directAnswer = `Actionable strategies to sell your ${title} faster:`;
      sellingTips = [
        'Create Process Reels: Share 15-second crafting videos showing your hands making the piece on Instagram & YouTube Shorts.',
        'Bundle Complementary Items: Pair with matching items to create gift sets and raise average order values.',
        'Participate in Craft Melas: Showcase at local exhibitions and share your Karigar online QR code catalogue.'
      ];
      specificKeywords = [`Sell ${title}`, 'Handmade marketing', craft, material];
    }
  }

  // 5. Target Audience / Buyers
  else if (
    lowerQ.includes('buyer') || 
    lowerQ.includes('customer') || 
    lowerQ.includes('audience') || 
    lowerQ.includes('target') || 
    lowerQ.includes('खरीदार') || 
    lowerQ.includes('ग्राहक') || 
    lowerQ.includes('लक्षित')
  ) {
    if (isHindi) {
      directAnswer = `आपके ${title} के लिए 3 प्रमुख लक्षित खरीदार वर्ग:`;
      sellingTips = [
        'शहरी गृह-सज्जा प्रेमी: वे खरीदार जो अपने आधुनिक घरों में पारंपरिक भारतीय कला और प्रामाणिक संस्कृति चाहते हैं।',
        'सांस्कृतिक कला पारखी: वास्तविक हस्तशिल्प और हथकरघा कलाकृतियों के प्रेमी जो शिल्पकार के सीधे काम को महत्व देते हैं।',
        `पर्यावरण-सचेत ग्राहक: प्राकृतिक ${material} से बनी टिकाऊ, हस्तनिर्मित और प्लास्टिक-मुक्त वस्तुओं के आकांक्षी।`
      ];
      specificKeywords = ['शिल्प खरीदार', 'हस्तनिर्मित डेकोर', craft, material, title];
    } else {
      directAnswer = `Primary target buyers for your ${title}:`;
      sellingTips = [
        'Urban Home Decorators: Seeking authentic cultural warmth for modern living spaces.',
        'Heritage & Craft Connoisseurs: Valuing genuine artisan techniques and handmade provenance.',
        `Eco-Conscious Shoppers: Looking for natural ${material} sustainable crafts.`
      ];
      specificKeywords = ['Artisan craft buyers', 'Authentic handmade decor', craft, material, title];
    }
  }

  // 6. Keywords & Search
  else if (
    lowerQ.includes('keyword') || 
    lowerQ.includes('search') || 
    lowerQ.includes('कीवर्ड') || 
    lowerQ.includes('सर्च') || 
    lowerQ.includes('टैग')
  ) {
    if (isHindi) {
      directAnswer = `आपके ${title} के लिए सबसे अधिक खोजे जाने वाले कीवर्ड्स:`;
      sellingTips = [
        `उत्पाद शीर्षक में प्रयोग करें: "हस्तनिर्मित ${material} ${title} — प्रामाणिक ${craft} धरोहर"`,
        `सोशल व सर्च टैग्स: #${craft.replace(/\s+/g, '')}, #${material.replace(/\s+/g, '')}, #हस्तशिल्प, #IndianHandicrafts, #HandmadeWithLove`,
        'उत्पाद विवरण में शामिल करें: 100% प्रामाणिक, टिकाऊ, पारंपरिक तकनीक, हस्तनिर्मित उपहार।'
      ];
      specificKeywords = [title, craft, material, 'हस्तशिल्प', 'भारतीय शिल्प', 'कारीगर उत्पाद', 'हथकरघा'];
    } else {
      directAnswer = `High-intent search terms for your ${title}:`;
      sellingTips = [
        `Use in title: "Handcrafted ${material} ${title} - Authentic ${craft} Heritage"`,
        `Social & Search tags: #${craft.replace(/\s+/g, '')}, #${material.replace(/\s+/g, '')}, #IndianHandicrafts, #HandmadeWithLove`,
        'Include in description: authentic origin, eco-friendly, traditional technique, artisan gift.'
      ];
      specificKeywords = [title, craft, material, 'Handmade craft', 'Indian artisan'];
    }
  }

  // 7. Festivals, Gifting & Weddings
  else if (
    lowerQ.includes('festival') || 
    lowerQ.includes('diwali') || 
    lowerQ.includes('navratri') || 
    lowerQ.includes('rakhi') || 
    lowerQ.includes('wedding') || 
    lowerQ.includes('gift') || 
    lowerQ.includes('hamper') || 
    lowerQ.includes('corporate') ||
    lowerQ.includes('त्योहार') ||
    lowerQ.includes('उपहार') ||
    lowerQ.includes('गिफ्ट') ||
    lowerQ.includes('शादी')
  ) {
    if (isHindi) {
      directAnswer = `आपके ${title} के लिए त्योहारी और उपहार रणनीति:`;
      sellingTips = [
        'त्योहारी स्थिति: दिवाली, नवरात्रि और शादियों के लिए शुभ और प्रामाणिक उपहार के रूप में प्रस्तुत करें।',
        'इको-फ्रेंडली पैकेजिंग: आकर्षक कपड़े की पोटली या उपहार बॉक्स के साथ कारीगर आशीर्वाद कार्ड जोड़ें।',
        'कॉर्पोरेट बल्क ऑर्डर: दिवाली कॉर्पोरेट उपहारों के लिए 6 सप्ताह पहले बल्क पैकेज की पेशकश करें।'
      ];
      specificKeywords = ['दिवाली उपहार', 'शादी रिटर्न गिफ्ट', 'कारीगर गिफ्ट हैंपर', title, craft];
    } else {
      directAnswer = `Festive & gifting strategy for your ${title}:`;
      sellingTips = [
        'Festive Position: Market as an auspicious, authentic Diwali / wedding keepsake.',
        'Packaging: Use eco-friendly cloth potli or gift box with a printed artisan blessing card.',
        'Corporate Orders: Offer bulk packages for Diwali corporate hampers 6 weeks in advance.'
      ];
      specificKeywords = ['Diwali craft gift', 'Wedding return favor', 'Artisan gift hamper', title];
    }
  }

  // 8. Social Media & Instagram
  else if (
    lowerQ.includes('instagram') || 
    lowerQ.includes('reel') || 
    lowerQ.includes('social media') || 
    lowerQ.includes('whatsapp') || 
    lowerQ.includes('facebook') || 
    lowerQ.includes('promote') || 
    lowerQ.includes('marketing') || 
    lowerQ.includes('followers') ||
    lowerQ.includes('सोशल') ||
    lowerQ.includes('रील')
  ) {
    if (isHindi) {
      directAnswer = `आपके ${title} के लिए सोशल मीडिया कार्य योजना:`;
      sellingTips = [
        `ट्रेंडिंग ऑडियो के साथ ${craft} बनाते हुए अपने हाथों का 15 सेकंड का रील वीडियो पोस्ट करें।`,
        'अपनी स्टोरीज़ में ग्राहकों के अनबॉक्सिंग वीडियो और सकारात्मक व्हाट्सएप समीक्षाएं साझा करें।',
        'अपने बायो में स्पष्ट "Order on WhatsApp" लिंक जोड़ें ताकि खरीदार सीधे बात करके खरीद सकें।'
      ];
      specificKeywords = [`#${craft.replace(/\s+/g, '')}`, '#हस्तशिल्प', '#भारतीयकारीगर', title];
    } else {
      directAnswer = `Social media action steps for your ${title}:`;
      sellingTips = [
        `Post 15-second Reels showing your hands making the ${craft} piece with trending sound.`,
        'Share customer unboxing photos and positive WhatsApp reviews in your stories.',
        'Add your WhatsApp catalog link in your Instagram bio with a clear "Order on WhatsApp" CTA.'
      ];
      specificKeywords = [`#${craft.replace(/\s+/g, '')}`, '#IndianHandicrafts', '#HandmadeWithLove', title];
    }
  }

  const suggestedTitle = isHindi
    ? `हस्तनिर्मित ${material} ${title} — प्रामाणिक ${craft} धरोहर`
    : `Handcrafted ${material} ${title} - Authentic ${craft} Heritage`;

  const suggestedReason = isHindi
    ? 'सामग्री की प्रामाणिकता, शिल्प कौशल और खोज-अनुकूल स्पष्टता को एक साथ जोड़ता है।'
    : 'Combines material authenticity, search-friendly craft keywords, and professional e-commerce clarity.';

  const disclaimer = isHindi
    ? 'एआई बिजनेस सलाहकार की सिफारिशें रणनीतिक मार्गदर्शन हैं। बिक्री बाज़ार की मांग, उत्पाद की गुणवत्ता और विपणन प्रयासों पर निर्भर करती है। कारीगर एआई विशिष्ट आय की गारंटी नहीं देता है।'
    : 'AI Business Advisor recommendations are strategic guidelines. Sales depend on market demand, product quality, and marketing efforts. KarigarAI does not guarantee specific earnings.';

  return {
    directAnswer,
    advice: {
      betterTitle: {
        suggestedTitle,
        reason: suggestedReason
      },
      keywords: specificKeywords,
      pricingSuggestions: {
        strategy: pricingStrategy,
        framing: pricingFraming
      },
      targetAudience,
      festivalPositioning: {
        festivals: isHindi
          ? ['दिवाली फेस्टिव हैंपर्स', 'नवरात्रि / दशहरा उत्सव', 'विवाह उपहार', 'नववर्ष कॉर्पोरेट गिफ्ट']
          : ['Diwali Festive Hampers', 'Navratri / Dussehra Celebrations', 'Wedding Return Favors', 'New Year Corporate Gifts'],
        pitch: festivalPitch
      },
      giftingPositioning: {
        giftingOccasions: isHindi
          ? ['गृह प्रवेश', 'कॉर्पोरेट उपहार', 'शादी रिटर्न गिफ्ट्स', 'त्योहारी हैंपर्स']
          : ['Housewarming (Griha Pravesh)', 'Corporate Appreciation', 'Wedding Return Gifts', 'Festive Gift Hampers'],
        packagingTip: giftingTip
      },
      photographyTips,
      descriptionTips,
      sellingTips
    },
    disclaimer
  };
}

/**
 * Validate and clean LLM advisor JSON schema
 */
function validateAdvisorSchema(parsed, fallback) {
  if (!parsed || typeof parsed !== 'object') return fallback;

  const sanitizeStr = (str, def) => (typeof str === 'string' && str.trim() ? str.trim() : def);
  const sanitizeArr = (arr, def) => (Array.isArray(arr) && arr.length > 0 ? arr.map(i => String(i).trim()).filter(Boolean) : def);

  const adviceObj = parsed.advice || {};

  return {
    directAnswer: sanitizeStr(parsed.directAnswer, fallback.directAnswer),
    advice: {
      betterTitle: {
        suggestedTitle: sanitizeStr(adviceObj.betterTitle?.suggestedTitle, fallback.advice.betterTitle.suggestedTitle),
        reason: sanitizeStr(adviceObj.betterTitle?.reason, fallback.advice.betterTitle.reason),
      },
      keywords: sanitizeArr(adviceObj.keywords, fallback.advice.keywords),
      pricingSuggestions: {
        strategy: sanitizeStr(adviceObj.pricingSuggestions?.strategy, fallback.advice.pricingSuggestions.strategy),
        framing: sanitizeStr(adviceObj.pricingSuggestions?.framing, fallback.advice.pricingSuggestions.framing),
      },
      targetAudience: sanitizeArr(adviceObj.targetAudience, fallback.advice.targetAudience),
      festivalPositioning: {
        festivals: sanitizeArr(adviceObj.festivalPositioning?.festivals, fallback.advice.festivalPositioning.festivals),
        pitch: sanitizeStr(adviceObj.festivalPositioning?.pitch, fallback.advice.festivalPositioning.pitch),
      },
      giftingPositioning: {
        giftingOccasions: sanitizeArr(adviceObj.giftingPositioning?.giftingOccasions, fallback.advice.giftingPositioning.giftingOccasions),
        packagingTip: sanitizeStr(adviceObj.giftingPositioning?.packagingTip, fallback.advice.giftingPositioning.packagingTip),
      },
      photographyTips: sanitizeArr(adviceObj.photographyTips, fallback.advice.photographyTips),
      descriptionTips: sanitizeArr(adviceObj.descriptionTips, fallback.advice.descriptionTips),
      sellingTips: sanitizeArr(adviceObj.sellingTips, fallback.advice.sellingTips),
    },
    disclaimer: sanitizeStr(parsed.disclaimer, fallback.disclaimer),
  };
}

/**
 * Main AI Business Advisor Generator Function
 */
export async function generateBusinessAdvice({ question, productContext = {}, conversationHistory = [], language = 'EN' }) {
  const fallback = heuristicAdvisorFallback({ question, productContext, language });
  const prompt = buildAdvisorPrompt({ question, productContext, conversationHistory, language });

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
            temperature: 0.3,
            response_mime_type: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = sanitizeJsonResponse(rawText);
        const validated = validateAdvisorSchema(parsed, fallback);

        return {
          success: true,
          adviceData: validated,
          engine: 'gemini-business-advisor',
        };
      }
    } catch (geminiErr) {
      console.warn('Gemini Business Advisor error, trying fallback:', geminiErr.message);
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
            { role: 'system', content: ADVISOR_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.choices?.[0]?.message?.content;
        const parsed = sanitizeJsonResponse(rawText);
        const validated = validateAdvisorSchema(parsed, fallback);

        return {
          success: true,
          adviceData: validated,
          engine: 'openai-business-advisor',
        };
      }
    } catch (openaiErr) {
      console.warn('OpenAI Business Advisor error:', openaiErr.message);
    }
  }

  // 3. Smart Heuristic Fallback
  return {
    success: true,
    adviceData: fallback,
    engine: 'karigar-heuristic-business-advisor',
  };
}

export default {
  generateBusinessAdvice,
};
