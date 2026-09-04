import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const CATEGORY_TRANSLATIONS = {
  'Pottery & Ceramics': 'मिट्टी के बर्तन और सिरेमिक्स',
  'Festive Craft': 'उत्सव और त्योहार शिल्प',
  'Textiles & Apparel': 'वस्त्र और परिधान',
  'Wood Crafts': 'काष्ठ शिल्प',
  'Bags & Accessories': 'बैग और सहायक उपकरण',
  'Paintings & Folk Art': 'चित्रकला और लोक कला',
  'Jewelry & Metalware': 'आभूषण और धातु शिल्प',
  'All Crafts': 'सभी श्रेणियां',
  'All Categories': 'सभी श्रेणियां',
};

export const STATUS_TRANSLATIONS = {
  'Market-Ready': 'बाज़ार-तैयार',
  'Published': 'प्रकाशित',
  'Draft': 'ड्राफ्ट',
  'Pending': 'लंबित',
  'Active': 'सक्रिय',
};

export const TRANSLATIONS = {
  EN: {
    brand: 'KarigarAI',
    brandTagline: 'From Handmade to Market-Ready in Minutes',
    // Navigation
    nav: {
      home: 'Home',
      myProducts: 'My Products',
      addProduct: 'Add Product',
      aiMarketStudio: 'AI Market Studio',
      profile: 'Profile',
      logout: 'Logout',
      login: 'Login',
      demoMode: '● Demo Mode Ready',
      changeLang: 'Change Language (English / हिंदी)',
      studio: 'Photo Studio',
      pricing: 'Pricing',
      advisor: 'Advisor',
      catalogue: 'Catalogue',
      preview: 'Live Preview',
    },
    // Home Dashboard
    home: {
      platformBadge: 'AI PLATFORM FOR ARTISANS',
      welcome: 'Welcome back',
      welcomeSubtitle: 'Turn your handmade products into market-ready listings with AI.',
      quickActions: 'Quick Actions',
      addNewCraft: 'Add New Product',
      addNewCraftDesc: 'Upload craft photos, speak voice notes, and let AI build your product.',
      openAiStudio: 'Open AI Market Studio',
      openAiStudioDesc: 'Generate multilingual catalogues, remove backgrounds, and price smartly.',
      viewCatalogue: 'My Catalogue',
      viewCatalogueDesc: 'Manage your handcrafted inventory and export to marketplaces.',
      marketplacePreview: 'Marketplace Preview',
      marketplacePreviewDesc: 'See how your products look on live e-commerce buyer marketplaces.',
      totalProducts: 'TOTAL PRODUCTS',
      publishedCount: 'PUBLISHED',
      draftCount: 'DRAFTS',
      totalValue: 'CATALOGUE VALUE',
      allProducts: 'All Products',
      publishedProducts: 'Published Products',
      draftProducts: 'Draft Products',
      recentCrafts: 'Recent Artisan Crafts',
      viewAll: 'View All Catalogue →',
      noProducts: 'No products added yet. Click "Add Product" to get started!',
      searchPlaceholder: 'Filter your craft inventory...',
      thImage: 'Image',
      thProduct: 'Product Details',
      thCategory: 'Category',
      thPrice: 'Price',
      thStatus: 'Status',
      thActions: 'Actions',
      actionView: 'View',
      actionEdit: 'Edit',
      actionDelete: 'Delete',
      actionEnhance: 'AI Studio',
      emptyTitle: 'No crafts found in this view',
      emptySubtitle: 'Start creating your digital artisan catalogue today.',
    },
    // Add Product
    addProduct: {
      pageTitle: 'Add New Artisan Product',
      pageSubtitle: 'Create a market-ready listing with step-by-step AI studio automation.',
      step1: 'Product Basics',
      step2: 'Product Photo',
      step3: 'Studio & AI Analysis',
      voiceHeroBadge: 'Voice-First AI Listing',
      voiceHeroTitle: '🎙️ Voice Craft Assistant',
      voiceHeroDesc: 'Speak your craft details naturally in Hindi, Gujarati, or English. AI automatically fills Title, Category, Material, Technique, Price, Cost, and Story into your form fields!',
      startVoiceBtn: 'Start Voice Assistant 🎙️',
      quickDemoSamples: 'Quick Demo Samples (Click to Test):',
      demoHindi: '🇮🇳 Demo (Hindi Pottery)',
      demoGujarati: '🇮🇳 Demo (Gujarati Rogan Art)',
      demoEnglish: '🌐 Demo (English Craft)',
      formTitle: 'Step 1: Product Basics Form',
      formSubtitle: 'All fields below are populated by Voice AI and can be freely modified anytime.',
      voiceFilledBadge: '✨ Voice Details Extracted! Fields populated from spoken audio. You can edit any field anytime.',
      speakAgain: 'Speak Again 🎙️',
      titleLabel: 'Product Name / Title (Short & English only)',
      titlePlaceholder: 'e.g. Handmade Festive Rakhi (2-4 words in English)',
      titleHelp: 'Keep title short (2 to 4 words) in English only for optimal marketplace search.',
      categoryLabel: 'Craft Category',
      materialLabel: 'Material',
      materialPlaceholder: 'e.g. Terracotta Clay / Pure Silk',
      techniqueLabel: 'Craft Technique',
      techniquePlaceholder: 'e.g. Wheel Pottery / Hand Embroidery',
      sellingPriceLabel: 'Target Selling Price (₹)',
      materialCostLabel: 'Material Cost (₹)',
      storyLabel: 'Craft Story & Description',
      storyPlaceholder: 'Describe your craft creation process, materials, or artisan story...',
      nextPhotoBtn: 'Continue to Product Photo ➔',
      step2Title: 'Step 2: Upload Craft Photo',
      step2Subtitle: 'Upload or capture a photo. Studio enhancement & AI analysis will run automatically!',
      backToBasicsBtn: '← Back to Basics',
      runStudioBtn: 'Run Studio Enhancement ➔',
      step3Title: 'Step 3: Studio Enhancement & Multimodal AI Analysis',
      pipelineHeader: 'AI Photo Studio & Vision Pipeline',
      pipelineSub: 'Automatic background removal, pure white studio compositing & multimodal analysis',
      stageUploading: 'Uploading',
      stageRemovingBg: 'Removing Background',
      stageEnhancing: 'Enhancing Image',
      stageCompleted: 'Completed',
      studioPresentationTitle: 'Product Studio Presentation',
      studioPresentationSub: 'Compare original photo with AI Studio background removal & lighting',
      originalBoxTitle: 'Original Uploaded Photo',
      originalBoxSub: 'Raw craft photography before AI enhancement',
      enhancedBoxTitle: 'AI Studio Enhanced Photo',
      enhancedBoxSub: 'Clean studio backdrop, enhanced lighting & sharpness',
      useOriginalBtn: 'Use Original Photo',
      useEnhancedBtn: '✓ Using Enhanced',
      retryEnhancementBtn: 'Retry Enhancement',
      detectedAttributesTitle: 'Detected AI Craft Attributes',
      detectedAttributesSub: 'Automatic visual observations. All detected attributes are fully editable.',
      detectedTypeLabel: 'Detected Product Type',
      detectedCategoryLabel: 'Detected Category',
      detectedMaterialLabel: 'Detected Material',
      detectedTechniqueLabel: 'Detected Craft Technique',
      changePhotoBtn: '← Change Photo',
      saveAndCatalogueBtn: 'Save & View in Catalogue',
      proceedToAiStudioBtn: 'Save & Open AI Market Studio ➔',
      submitting: 'Saving Product...',
    },
    // Voice Recorder Modal
    voiceModal: {
      title: 'Voice Craft Assistant',
      subtitle: 'Speak in Hindi or English to describe your handicraft',
      spokenLangLabel: 'Spoken Language / बोली जाने वाली भाषा:',
      readyTitle: '🎤 Ready to Record',
      readyDesc: 'Tap the microphone and describe your craft (title, material, price, cost, and story).',
      useSampleBtn: '⚡ Use Sample Voice Prompt',
      recordingTitle: '🔴 Listening to your voice...',
      recordingDesc: 'Speak naturally about what you made, material used, and price.',
      stopBtn: 'Done Speaking (Stop & Extract) ✓',
      processingTitle: '⌛ Extracting Craft Details from Voice...',
      processingDesc: 'Parsing title, category, material, technique, price, and cost...',
      completeTitle: '✓ Voice Details Extracted (100% Editable)',
      extractedFields: '✨ AI Extracted Form Fields',
      titleField: 'Title:',
      categoryField: 'Category:',
      materialField: 'Material:',
      techniqueField: 'Technique:',
      priceField: 'Selling Price:',
      costField: 'Material Cost:',
      applyBtn: 'Apply to Form Fields ✓',
      cancelBtn: 'Close',
      reRecordBtn: 'Re-record',
      copyBtn: 'Copy Transcript',
      copiedToast: 'Transcript copied to clipboard!',
      errorTitle: '⚠ Voice Recording Notice',
    },
    // Catalogue
    catalogue: {
      pageTitle: 'My Artisan Catalogue',
      pageSubtitle: 'Manage, filter, publish, and inspect all craft documents in your artisan catalogue.',
      searchPlaceholder: 'Search by title, description, material, or tags...',
      allCategories: 'All Categories',
      allPrices: 'All Prices',
      allStatus: 'All Status',
      addProductBtn: '+ Add Craft',
      exportJson: 'Export JSON',
      exportCsv: 'Export CSV',
      emptyTitle: 'No Products Found',
      emptySubtitle: 'Start adding your handcrafted creations using AI voice or image uploads.',
      viewDetails: 'View Details',
      edit: 'Edit',
      delete: 'Delete',
      price: 'Price',
      cost: 'Cost',
      stock: 'Stock',
      status: 'Status',
      gridView: 'Grid',
      listView: 'List',
      confirmDelete: 'Are you sure you want to delete this product?',
      filterByCategory: 'Category Filter:',
      filterByPrice: 'Price Range:',
      filterByStatus: 'Listing Status:',
      resetFilters: 'Reset Filters',
    },
    // AI Market Studio
    studio: {
      pageTitle: 'AI Market Studio & Catalogue',
      pageSubtitle: 'Multimodal AI copywriter, studio photography enhancement, cost-plus pricing, and advisor.',
      selectProduct: 'Select Artisan Product to Enhance:',
      activeDocument: 'Active Craft Document',
      tabCopywriter: 'Multilingual Copywriter',
      tabPricing: 'Smart Cost-Plus Pricing',
      tabStudio: 'Photo Studio Enhancer',
      tabAdvisor: 'AI Business Advisor',
      generateListingBtn: 'Generate AI Multilingual Listing ✨',
      generating: 'Generating AI Catalogue...',
      catalogueOutput: 'AI Generated Product Listing',
      title: 'Product Title',
      shortDesc: 'Short Summary',
      fullDesc: 'Craft Story & Detailed Description',
      keywords: 'Search Keywords',
      tags: 'Marketplace Tags',
      targetAudience: 'Target Audience Persona',
      languageChoice: 'Output Language:',
      english: 'English (India)',
      hindi: 'हिन्दी (Hindi)',
      saveToProductBtn: 'Save Generated Listing to Product ✓',
      savedSuccess: 'Catalogue listing saved to product!',
      pricingHeader: 'Explainable Cost-Plus Pricing',
      pricingSub: 'Fair artisan remuneration with margin sliders and demand benchmarks',
      calculatePricingBtn: 'Calculate Smart Price 💰',
      calculatingPricing: 'Calculating Pricing Formula...',
      advisorHeader: 'AI Artisan Business Advisor',
      advisorSub: 'Ask practical questions on marketplaces, festivals, packaging, and photography',
      askAdvisorPlaceholder: 'Ask a question (e.g. Where can I sell this? How to price for festivals?)...',
      sendQuestionBtn: 'Ask Advisor',
      suggestedQuestions: 'Suggested Artisan Questions:',
      advisorDisclaimer: 'KarigarAI provides practical selling tips and never guarantees unrealistic income.',
    },
    // Product Details
    productDetails: {
      backBtn: '← Back to Catalogue',
      marketReadyBadge: 'Market-Ready Listing',
      specifications: 'Craft Specifications',
      category: 'Category',
      material: 'Material',
      technique: 'Technique',
      sellingPrice: 'Selling Price',
      materialCost: 'Material Cost',
      labourCost: 'Labour Cost',
      profitMargin: 'Estimated Profit Margin',
      craftStory: 'Artisan Story & Craft Process',
      openAiStudio: 'Open in AI Market Studio ✨',
      previewMarketplace: 'Preview on Marketplace 🛍️',
      deleteBtn: 'Delete Product',
    },
    // Marketplace Preview
    preview: {
      pageTitle: 'Live Marketplace Preview Simulator',
      pageSubtitle: 'Experience how buyers see and purchase your handcrafted item across top digital channels.',
      selectPlatform: 'Select Marketplace View:',
      amazonIndia: 'Amazon Karigar',
      flipkartSamarth: 'Flipkart Samarth',
      etsyIndia: 'Etsy Global',
      ondcNetwork: 'ONDC Artisan Network',
      inStock: 'In Stock - Ships directly from artisan workshop',
      verifiedArtisan: 'Verified Traditional Artisan Craft',
      addToCart: 'Add to Cart',
      buyNow: 'Buy Now',
      artisanProfile: 'About the Artisan',
      ratings: 'Customer Rating & Reviews',
      reviewsCount: 'verified craft reviews',
      culturalStory: 'Heritage & Craftsmanship Story',
      exportListing: 'Export Marketplace Listing JSON',
    },
    // Profile
    profile: {
      pageTitle: 'Artisan Profile & Craft Hub',
      pageSubtitle: 'Manage your artisan identity, craft hub credentials, and platform language.',
      storeName: 'Artisan Store / Workshop Name',
      craftSpecialization: 'Primary Craft Specialization',
      experience: 'Years of Craft Experience',
      location: 'Workshop Location / City / State',
      upiId: 'UPI ID for Direct Artisan Payouts',
      bio: 'Artisan Story & Heritage Bio',
      preferredLangLabel: 'Preferred Platform Language (English / हिंदी)',
      saveBtn: 'Save Profile Changes ✓',
      saving: 'Saving Changes...',
      englishLabel: '🌐 English (EN)',
      hindiLabel: '🇮🇳 हिंदी (HI)',
      artisanRating: 'Artisan Trust Score',
      craftExperienceYears: 'years master crafting',
    },
    // Auth
    auth: {
      loginTitle: 'Sign In to KarigarAI',
      loginSubtitle: 'Empowering Indian artisans with Multimodal AI',
      emailLabel: 'Email Address',
      emailPlaceholder: 'ramesh@karigar.in',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      signInBtn: 'Sign In 🚀',
      demoLoginBtn: '⚡ Instant Demo Login (Rameshbhai Prajapati)',
      noAccount: "Don't have an account?",
      registerLink: 'Create Artisan Account',
      registerTitle: 'Create Artisan Account',
      registerSubtitle: 'Join KarigarAI to digitize, price, and sell your crafts with AI',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'e.g. Rameshbhai Prajapati',
      phoneLabel: 'Phone Number (Optional)',
      phonePlaceholder: 'e.g. 9876543210',
      craftTypeLabel: 'Primary Craft Type',
      craftTypePlaceholder: 'e.g. Terracotta & Clay Pottery',
      locationLabel: 'Workshop Location / City',
      locationPlaceholder: 'e.g. Kutch, Gujarat',
      haveAccount: 'Already have an account?',
      loginLink: 'Sign In here',
      createAccountBtn: 'Register Artisan Account ✨',
    },
    // Common
    common: {
      loading: 'Loading KarigarAI...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      success: 'Success',
      error: 'Error',
      info: 'Info',
      currency: '₹',
    }
  },

  HI: {
    brand: 'कारीगर एआई',
    brandTagline: 'हस्तशिल्प से बाज़ार तक — कुछ ही मिनटों में',
    // Navigation
    nav: {
      home: 'होम',
      myProducts: 'मेरे उत्पाद',
      addProduct: 'उत्पाद जोड़ें',
      aiMarketStudio: 'एआई मार्केट स्टूडियो',
      profile: 'प्रोफ़ाइल',
      logout: 'लॉगआउट',
      login: 'लॉगिन',
      demoMode: '● डेमो मोड सक्रिय',
      changeLang: 'भाषा बदलें (English / हिंदी)',
      studio: 'फ़ोटो स्टूडियो',
      pricing: 'स्मार्ट मूल्य',
      advisor: 'व्यवसाय सलाहकार',
      catalogue: 'कैटलॉग',
      preview: 'लाइव पूर्वावलोकन',
    },
    // Home Dashboard
    home: {
      platformBadge: 'भारतीय कारीगरों के लिए एआई मंच',
      welcome: 'नमस्ते',
      welcomeSubtitle: 'एआई के साथ अपने हस्तनिर्मित उत्पादों को बाज़ार-तैयार लिस्टिंग में बदलें।',
      quickActions: 'त्वरित कार्य',
      addNewCraft: 'नया उत्पाद जोड़ें',
      addNewCraftDesc: 'शिल्प की फ़ोटो अपलोड करें, बोलकर विवरण दें और एआई से उत्पाद तैयार कराएं।',
      openAiStudio: 'एआई मार्केट स्टूडियो खोलें',
      openAiStudioDesc: 'बहुभाषी कैटलॉग बनाएं, बैकग्राउंड हटाएं और स्मार्ट मूल्य निर्धारण करें।',
      viewCatalogue: 'मेरा कैटलॉग',
      viewCatalogueDesc: 'अपने हस्तशिल्प इन्वेंटरी को प्रबंधित करें और मार्केटप्लेस पर निर्यात करें।',
      marketplacePreview: 'मार्केटप्लेस पूर्वावलोकन',
      marketplacePreviewDesc: 'देखें कि खरीदारों के लिए आपके उत्पाद मार्केटप्लेस पर कैसे दिखेंगे।',
      totalProducts: 'कुल उत्पाद',
      publishedCount: 'प्रकाशित',
      draftCount: 'ड्राफ्ट',
      totalValue: 'कुल कैटलॉग मूल्य',
      allProducts: 'सभी उत्पाद',
      publishedProducts: 'प्रकाशित उत्पाद',
      draftProducts: 'ड्राफ्ट उत्पाद',
      recentCrafts: 'हाल के हस्तशिल्प',
      viewAll: 'पूरा कैटलॉग देखें →',
      noProducts: 'अभी तक कोई उत्पाद नहीं जोड़ा गया। शुरू करने के लिए "उत्पाद जोड़ें" पर क्लिक करें!',
      searchPlaceholder: 'शिल्प इन्वेंटरी में खोजें...',
      thImage: 'फ़ोटो',
      thProduct: 'उत्पाद विवरण',
      thCategory: 'श्रेणी',
      thPrice: 'मूल्य',
      thStatus: 'स्थिति',
      thActions: 'कार्य',
      actionView: 'देखें',
      actionEdit: 'संपादित करें',
      actionDelete: 'हटाएं',
      actionEnhance: 'एआई स्टूडियो',
      emptyTitle: 'इस दृश्य में कोई शिल्प नहीं मिला',
      emptySubtitle: 'आज ही अपना डिजिटल कारीगर कैटलॉग बनाना शुरू करें।',
    },
    // Add Product
    addProduct: {
      pageTitle: 'नया शिल्प उत्पाद जोड़ें',
      pageSubtitle: 'चरण-दर-चरण एआई स्टूडियो ऑटोमेशन के साथ बाज़ार-तैयार लिस्टिंग बनाएं।',
      step1: 'उत्पाद विवरण',
      step2: 'उत्पाद फ़ोटो',
      step3: 'स्टूडियो और एआई विश्लेषण',
      voiceHeroBadge: 'वॉइस-फ़र्स्ट एआई लिस्टिंग',
      voiceHeroTitle: '🎙️ वॉइस शिल्प सहायक',
      voiceHeroDesc: 'हिंदी, गुजराती या अंग्रेजी में अपने शिल्प का विवरण बोलें। एआई स्वचालित रूप से शीर्षक, श्रेणी, सामग्री, तकनीक, मूल्य, लागत और विवरण भर देगा!',
      startVoiceBtn: 'वॉइस सहायक शुरू करें 🎙️',
      quickDemoSamples: 'त्वरित डेमो नमूने (परीक्षण के लिए क्लिक करें):',
      demoHindi: '🇮🇳 डेमो (हिंदी मिट्टी के बर्तन)',
      demoGujarati: '🇮🇳 डेमो (गुजराती रोगन शिल्प)',
      demoEnglish: '🌐 डेमो (अंग्रेजी शिल्प)',
      formTitle: 'चरण 1: उत्पाद मूल विवरण फॉर्म',
      formSubtitle: 'नीचे दिए गए सभी फ़ील्ड वॉइस एआई द्वारा भरे गए हैं और कभी भी बदले जा सकते हैं।',
      voiceFilledBadge: '✨ वॉइस विवरण निकाला गया! बोले गए ऑडियो से फ़ील्ड भरे गए हैं। आप कभी भी बदलाव कर सकते हैं।',
      speakAgain: 'दोबारा बोलें 🎙️',
      titleLabel: 'उत्पाद का नाम / शीर्षक (संक्षिप्त और केवल अंग्रेजी)',
      titlePlaceholder: 'उदा. Handmade Festive Rakhi (अंग्रेजी में 2-4 शब्द)',
      titleHelp: 'मार्केटप्लेस खोज के लिए शीर्षक को केवल अंग्रेजी में संक्षिप्त (2 से 4 शब्द) रखें।',
      categoryLabel: 'शिल्प श्रेणी',
      materialLabel: 'सामग्री',
      materialPlaceholder: 'उदा. टेराकोटा मिट्टी / शुद्ध रेशम',
      techniqueLabel: 'शिल्प तकनीक',
      techniquePlaceholder: 'उदा. चाक पॉटरी / हाथ की कढ़ाई',
      sellingPriceLabel: 'लक्षित बिक्री मूल्य (₹)',
      materialCostLabel: 'सामग्री लागत (₹)',
      storyLabel: 'शिल्प की कहानी और विवरण',
      storyPlaceholder: 'अपनी शिल्प निर्माण प्रक्रिया, सामग्री या कारीगर कहानी का विवरण दें...',
      nextPhotoBtn: 'आगे: शिल्प फ़ोटो जोड़ें ➔',
      step2Title: 'चरण 2: शिल्प फ़ोटो अपलोड करें',
      step2Subtitle: 'फ़ोटो अपलोड करें। स्टूडियो संवर्धन और एआई विश्लेषण स्वचालित रूप से चलेगा!',
      backToBasicsBtn: '← वापस विवरण पर जाएं',
      runStudioBtn: 'स्टूडियो संवर्धन चलाएं ➔',
      step3Title: 'चरण 3: स्टूडियो संवर्धन और मल्टीमॉडल एआई विश्लेषण',
      pipelineHeader: 'एआई फ़ोटो स्टूडियो और विज़न पाइपलाइन',
      pipelineSub: 'स्वचालित बैकग्राउंड निष्कासन, स्टूडियो लाइटिंग और मल्टीमॉडल शिल्प विश्लेषण',
      stageUploading: 'अपलोड हो रहा है',
      stageRemovingBg: 'बैकग्राउंड हटाया जा रहा है',
      stageEnhancing: 'फ़ोटो संवर्धन जारी है',
      stageCompleted: 'सफलतापूर्वक पूर्ण',
      studioPresentationTitle: 'उत्पाद स्टूडियो प्रस्तुति',
      studioPresentationSub: 'मूल फ़ोटो और एआई स्टूडियो बैकग्राउंड संवर्धन की तुलना करें',
      originalBoxTitle: 'मूल अपलोड की गई फ़ोटो',
      originalBoxSub: 'एआई संवर्धन से पहले की सामान्य फ़ोटो',
      enhancedBoxTitle: 'एआई स्टूडियो संवर्धित फ़ोटो',
      enhancedBoxSub: 'सफेद स्टूडियो बैकग्राउंड, बेहतर लाइटिंग और स्पष्टता',
      useOriginalBtn: 'मूल फ़ोटो का उपयोग करें',
      useEnhancedBtn: '✓ संवर्धित फ़ोटो का उपयोग करें',
      retryEnhancementBtn: 'संवर्धन पुनः प्रयास करें',
      detectedAttributesTitle: 'एआई द्वारा पहचाने गए शिल्प लक्षण',
      detectedAttributesSub: 'स्वचालित दृश्य अवलोकन। सभी पहचाने गए लक्षण पूरी तरह संपादन योग्य हैं।',
      detectedTypeLabel: 'पहचाना गया उत्पाद प्रकार',
      detectedCategoryLabel: 'पहचानी गई श्रेणी',
      detectedMaterialLabel: 'पहचानी गई सामग्री',
      detectedTechniqueLabel: 'पहचानी गई शिल्प तकनीक',
      changePhotoBtn: '← फ़ोटो बदलें',
      saveAndCatalogueBtn: 'सहेजें और कैटलॉग में देखें',
      proceedToAiStudioBtn: 'सहेजें और एआई मार्केट स्टूडियो खोलें ➔',
      submitting: 'उत्पाद सहेजा जा रहा है...',
    },
    // Voice Recorder Modal
    voiceModal: {
      title: 'वॉइस शिल्प सहायक',
      subtitle: 'अपने हस्तशिल्प का वर्णन करने के लिए हिंदी या अंग्रेजी में बोलें',
      spokenLangLabel: 'बोली जाने वाली भाषा / Spoken Language:',
      readyTitle: '🎤 रिकॉर्ड करने के लिए तैयार',
      readyDesc: 'माइक्रोफ़ोन पर टैप करें और अपने शिल्प का विवरण दें (नाम, सामग्री, कीमत, लागत और कहानी)।',
      useSampleBtn: '⚡ नमूना वॉइस प्रॉम्प्ट का उपयोग करें',
      recordingTitle: '🔴 आपकी आवाज़ सुनी जा रही है...',
      recordingDesc: 'आपने क्या बनाया है, कौन सी सामग्री उपयोग की और कीमत क्या है, खुलकर बोलें।',
      stopBtn: 'बोलना पूरा हुआ (रोकें और निकालें) ✓',
      processingTitle: '⌛ वॉइस से शिल्प विवरण निकाला जा रहा है...',
      processingDesc: 'शीर्षक, श्रेणी, सामग्री, तकनीक, मूल्य और लागत का विश्लेषण जारी है...',
      completeTitle: '✓ वॉइस विवरण निकाला गया (100% संपादन योग्य)',
      extractedFields: '✨ एआई द्वारा निकाले गए फॉर्म फ़ील्ड्स',
      titleField: 'शीर्षक (Title):',
      categoryField: 'श्रेणी (Category):',
      materialField: 'सामग्री (Material):',
      techniqueField: 'तकनीक (Technique):',
      priceField: 'बिक्री मूल्य:',
      costField: 'सामग्री लागत:',
      applyBtn: 'फॉर्म में लागू करें ✓',
      cancelBtn: 'बंद करें',
      reRecordBtn: 'दोबारा रिकॉर्ड करें',
      copyBtn: 'टेक्स्ट कॉपी करें',
      copiedToast: 'टेक्स्ट क्लिपबोर्ड पर कॉपी किया गया!',
      errorTitle: '⚠ वॉइस रिकॉर्डिंग सूचना',
    },
    // Catalogue
    catalogue: {
      pageTitle: 'मेरा कारीगर कैटलॉग',
      pageSubtitle: 'अपने हस्तशिल्प उत्पादों को प्रबंधित करें, लाइव मार्केटप्लेस लिस्टिंग देखें और कैटलॉग निर्यात करें।',
      searchPlaceholder: 'शीर्षक, विवरण, सामग्री या टैग से खोजें...',
      allCategories: 'सभी श्रेणियां',
      allPrices: 'सभी मूल्य',
      allStatus: 'सभी स्थितियां',
      addProductBtn: '+ नया शिल्प जोड़ें',
      exportJson: 'JSON निर्यात',
      exportCsv: 'CSV निर्यात',
      emptyTitle: 'कोई उत्पाद नहीं मिला',
      emptySubtitle: 'वॉइस या फ़ोटो अपलोड का उपयोग करके अपनी रचनाएँ जोड़ना शुरू करें।',
      viewDetails: 'विवरण देखें',
      edit: 'संपादित करें',
      delete: 'हटाएं',
      price: 'मूल्य',
      cost: 'लागत',
      stock: 'स्टॉक',
      status: 'स्थिति',
      gridView: 'ग्रिड',
      listView: 'सूची',
      confirmDelete: 'क्या आप वाकई इस उत्पाद को हटाना चाहते हैं?',
      filterByCategory: 'श्रेणी फ़िल्टर:',
      filterByPrice: 'मूल्य सीमा:',
      filterByStatus: 'लिस्टिंग स्थिति:',
      resetFilters: 'फ़िल्टर रीसेट करें',
    },
    // AI Market Studio
    studio: {
      pageTitle: 'एआई मार्केट स्टूडियो और कैटलॉग',
      pageSubtitle: 'मल्टीमॉडल एआई कॉपीराइटर, स्टूडियो फ़ोटो संवर्धन, स्मार्ट मूल्य निर्धारण और व्यवसाय सलाहकार।',
      selectProduct: 'सुधारने के लिए कारीगर उत्पाद चुनें:',
      activeDocument: 'सक्रिय शिल्प दस्तावेज़',
      tabCopywriter: 'बहुभाषी कॉपीराइटर',
      tabPricing: 'स्मार्ट मूल्य निर्धारण',
      tabStudio: 'फ़ोटो स्टूडियो संवर्धक',
      tabAdvisor: 'एआई व्यवसाय सलाहकार',
      generateListingBtn: 'एआई बहुभाषी लिस्टिंग बनाएं ✨',
      generating: 'एआई कैटलॉग तैयार किया जा रहा है...',
      catalogueOutput: 'एआई द्वारा निर्मित उत्पाद लिस्टिंग',
      title: 'उत्पाद शीर्षक',
      shortDesc: 'संक्षिप्त सारांश',
      fullDesc: 'शिल्प की कहानी और विस्तृत विवरण',
      keywords: 'सर्च कीवर्ड्स',
      tags: 'मार्केटप्लेस टैग्स',
      targetAudience: 'लक्षित खरीदार वर्ग',
      languageChoice: 'आउटपुट भाषा:',
      english: 'English (अंग्रेज़ी)',
      hindi: 'हिन्दी (Hindi)',
      saveToProductBtn: 'निर्मित लिस्टिंग को उत्पाद में सहेजें ✓',
      savedSuccess: 'कैटलॉग लिस्टिंग उत्पाद में सहेजी गई!',
      pricingHeader: 'पारदर्शी लागत-आधारित मूल्य निर्धारण',
      pricingSub: 'उचित कारीगर पारिश्रमिक, मार्जिन स्लाइडर्स और मांग के आधार पर मूल्य',
      calculatePricingBtn: 'स्मार्ट मूल्य गणना करें 💰',
      calculatingPricing: 'मूल्य निर्धारण फ़ॉर्मूला गणना जारी...',
      advisorHeader: 'एआई कारीगर व्यवसाय सलाहकार',
      advisorSub: 'मार्केटप्लेस, त्योहारों, पैकेजिंग और फ़ोटोग्राफ़ी पर व्यावहारिक प्रश्न पूछें',
      askAdvisorPlaceholder: 'प्रश्न पूछें (उदा. मैं इसे कहाँ बेच सकता हूँ? त्योहारों के लिए क्या मूल्य रखें?)...',
      sendQuestionBtn: 'सलाहकार से पूछें',
      suggestedQuestions: 'कारीगरों के लिए सुझाए गए प्रश्न:',
      advisorDisclaimer: 'कारीगर एआई व्यावहारिक व्यावसायिक सुझाव देता है और कोई अवास्तविक आय का वादा नहीं करता।',
    },
    // Product Details
    productDetails: {
      backBtn: '← वापस कैटलॉग पर जाएं',
      marketReadyBadge: 'बाज़ार-तैयार लिस्टिंग',
      specifications: 'शिल्प विनिर्देश',
      category: 'श्रेणी',
      material: 'सामग्री',
      technique: 'तकनीक',
      sellingPrice: 'बिक्री मूल्य',
      materialCost: 'सामग्री लागत',
      labourCost: 'श्रम लागत',
      profitMargin: 'अनुमानित लाभ मार्जिन',
      craftStory: 'कारीगर कहानी और निर्माण प्रक्रिया',
      openAiStudio: 'एआई मार्केट स्टूडियो में खोलें ✨',
      previewMarketplace: 'मार्केटप्लेस पर देखें 🛍️',
      deleteBtn: 'उत्पाद हटाएं',
    },
    // Marketplace Preview
    preview: {
      pageTitle: 'लाइव मार्केटप्लेस पूर्वावलोकन सिम्युलेटर',
      pageSubtitle: 'अनुभव करें कि शीर्ष डिजिटल चैनलों पर खरीदार आपके हस्तशिल्प उत्पाद को कैसे देखते और खरीदते हैं।',
      selectPlatform: 'मार्केटप्लेस व्यू चुनें:',
      amazonIndia: 'अमेज़ॅन कारीगर (Amazon Karigar)',
      flipkartSamarth: 'फ्लिपकार्ट समर्थ (Flipkart Samarth)',
      etsyIndia: 'एट्सी ग्लोबल (Etsy India)',
      ondcNetwork: 'ओएनडीसी कारीगर नेटवर्क (ONDC Network)',
      inStock: 'स्टॉक में उपलब्ध — सीधे कारीगर कार्यशाला से भेजा जाएगा',
      verifiedArtisan: 'सत्यापित पारंपरिक भारतीय हस्तशिल्प',
      addToCart: 'कार्ट में जोड़ें',
      buyNow: 'अभी खरीदें',
      artisanProfile: 'कारीगर के बारे में',
      ratings: 'ग्राहक रेटिंग और समीक्षाएं',
      reviewsCount: 'सत्यापित समीक्षाएं',
      culturalStory: 'सांस्कृतिक विरासत और शिल्प कौशल',
      exportListing: 'मार्केटप्लेस लिस्टिंग JSON निर्यात करें',
    },
    // Profile
    profile: {
      pageTitle: 'कारीगर प्रोफ़ाइल और शिल्प केंद्र',
      pageSubtitle: 'अपनी कारीगर पहचान, शिल्प केंद्र विवरण और प्लेटफ़ॉर्म भाषा प्रबंधित करें।',
      storeName: 'कारीगर दुकान / कार्यशाला का नाम',
      craftSpecialization: 'मुख्य शिल्प विशेषज्ञता',
      experience: 'शिल्प अनुभव (वर्ष)',
      location: 'कार्यशाला स्थान / शहर / राज्य',
      upiId: 'सीधे भुगतान के लिए UPI ID',
      bio: 'कारीगर कहानी और विरासत बायो',
      preferredLangLabel: 'पसंदीदा प्लेटफ़ॉर्म भाषा (English / हिंदी)',
      saveBtn: 'प्रोफ़ाइल परिवर्तन सहेजें ✓',
      saving: 'परिवर्तन सहेजे जा रहे हैं...',
      englishLabel: '🌐 English (EN)',
      hindiLabel: '🇮🇳 हिंदी (HI)',
      artisanRating: 'कारीगर विश्वसनीयता स्कोर',
      craftExperienceYears: 'वर्षों का उत्कृष्ट शिल्प अनुभव',
    },
    // Auth
    auth: {
      loginTitle: 'कारीगर एआई में साइन इन करें',
      loginSubtitle: 'मल्टीमॉडल एआई के साथ भारतीय कारीगरों का सशक्तिकरण',
      emailLabel: 'ईमेल पता',
      emailPlaceholder: 'ramesh@karigar.in',
      passwordLabel: 'पासवर्ड',
      passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
      signInBtn: 'साइन इन करें 🚀',
      demoLoginBtn: '⚡ तुरंत डेमो लॉगिन (रमेशभाई प्रजापति)',
      noAccount: 'क्या आपके पास खाता नहीं है?',
      registerLink: 'नया कारीगर खाता बनाएं',
      registerTitle: 'कारीगर खाता बनाएं',
      registerSubtitle: 'एआई के साथ अपने शिल्प को डिजिटाइज़ करने और बेचने के लिए जुड़ें',
      fullNameLabel: 'पूरा नाम',
      fullNamePlaceholder: 'उदा. रमेशभाई प्रजापति',
      phoneLabel: 'फ़ोन नंबर (वैकल्पिक)',
      phonePlaceholder: 'उदा. 9876543210',
      craftTypeLabel: 'मुख्य शिल्प प्रकार',
      craftTypePlaceholder: 'उदा. टेराकोटा और मिट्टी के बर्तन',
      locationLabel: 'कार्यशाला स्थान / शहर',
      locationPlaceholder: 'उदा. कच्छ, गुजरात',
      haveAccount: 'पहले से खाता है?',
      loginLink: 'यहाँ साइन इन करें',
      createAccountBtn: 'कारीगर खाता पंजीकृत करें ✨',
    },
    // Common
    common: {
      loading: 'कारीगर एआई लोड हो रहा है...',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      back: 'पीछे',
      next: 'आगे',
      done: 'पूर्ण',
      success: 'सफलता',
      error: 'त्रुटि',
      info: 'सूचना',
      currency: '₹',
    }
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('karigar_lang');
      return (saved === 'HI' || saved === 'EN') ? saved : 'EN';
    } catch {
      return 'EN';
    }
  });

  const setLanguage = (newLang) => {
    const validLang = (newLang === 'HI' || newLang === 'hi' || newLang === 'hi-IN') ? 'HI' : 'EN';
    setLanguageState(validLang);
    try {
      localStorage.setItem('karigar_lang', validLang);
    } catch (err) {
      console.warn('Could not save language to localStorage:', err);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'EN' ? 'HI' : 'EN');
  };

  /**
   * Helper function to retrieve nested translation strings
   * Example: t('nav.home') -> "Home" or "होम"
   */
  const t = (keyPath, fallback = '') => {
    if (!keyPath) return fallback;
    const currentDict = TRANSLATIONS[language] || TRANSLATIONS.EN;
    const keys = keyPath.split('.');
    let current = currentDict;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to English dictionary if key not found
        let enCurrent = TRANSLATIONS.EN;
        for (const enK of keys) {
          if (enCurrent && typeof enCurrent === 'object' && enK in enCurrent) {
            enCurrent = enCurrent[enK];
          } else {
            return fallback || keyPath;
          }
        }
        return enCurrent || fallback || keyPath;
      }
    }

    return typeof current === 'string' ? current : (fallback || keyPath);
  };

  const translateCategory = (cat) => {
    if (!cat) return '';
    if (language === 'HI') {
      return CATEGORY_TRANSLATIONS[cat] || cat;
    }
    return cat;
  };

  const translateStatus = (status) => {
    if (!status) return '';
    if (language === 'HI') {
      return STATUS_TRANSLATIONS[status] || status;
    }
    return status;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      currentLang: language,
      setLanguage,
      toggleLanguage,
      t,
      translateCategory,
      translateStatus,
      isHindi: language === 'HI',
      isEnglish: language === 'EN'
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'EN',
      currentLang: 'EN',
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (k, fb) => fb || k,
      translateCategory: (c) => c,
      translateStatus: (s) => s,
      isHindi: false,
      isEnglish: true
    };
  }
  return context;
}

export default LanguageContext;
