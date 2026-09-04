// Realistic Dummy & Fallback Data for KarigarAI Artisan Platform

export const mockArtisanProfile = {
  id: "artisan_101",
  name: "Rameshbhai Prajapati",
  craftType: "Terracotta & Blue Pottery",
  location: "Kutch, Gujarat, India",
  experienceYears: 18,
  storeName: "Mitti Karigar Handicrafts",
  rating: 4.9,
  reviewsCount: 42,
  language: "Gujarati / Hindi / English",
  phone: "+91 98765 43210",
  upiId: "ramesh.prajapati@upi",
  bio: "Master craftsman preserving 3 generations of traditional hand-molded clay pottery, natural mineral glazing, and sustainable terracotta decor.",
  avatar: ""
};

// Required Demo Fallback Items
export const demoFallbackProducts = [
  {
    id: "fallback_bandhani_dupatta",
    name: "Kutch Silk Bandhani Dupatta",
    title: "Kutch Silk Bandhani Dupatta",
    category: "Textiles & Apparel",
    price: 2450,
    costPrice: 1100,
    materialCost: 750,
    labourCost: 350,
    packagingCost: 50,
    otherCost: 50,
    material: "Pure Mulberry Silk",
    craftType: "Tie-Dye Bandhani",
    stock: 8,
    status: "Market-Ready",
    description: "Authentic Gujarati Bandhani dupatta hand-tied with thousands of intricate micro-knots and dyed in vibrant organic madder red and turmeric yellow.",
    story: "Hand-crafted by women artisans in Kutch over 14 days of tedious knotting and natural dyeing.",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80",
    tags: ["Bandhani", "SilkDupatta", "Handloom", "EthicalFashion", "KutchCraft"],
    isDemoFallback: true
  },
  {
    id: "fallback_handmade_bag",
    name: "Handcrafted Jute Embroidered Tote Bag",
    title: "Handcrafted Jute Embroidered Tote Bag",
    category: "Bags & Accessories",
    price: 890,
    costPrice: 380,
    materialCost: 220,
    labourCost: 140,
    packagingCost: 20,
    otherCost: 0,
    material: "Eco-Friendly Jute & Cotton Canvas",
    craftType: "Mirror Work Embroidery",
    stock: 25,
    status: "Market-Ready",
    description: "Sustainable heavy-duty natural jute tote bag decorated with traditional Rabari thread work embroidery, wooden beads, and brass zip closures.",
    story: "Stitched by self-help artisan groups using 100% biodegradable Indian jute.",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80",
    tags: ["JuteBag", "HandmadeTote", "EcoFriendly", "MirrorWork", "ArtisanBag"],
    isDemoFallback: true
  },
  {
    id: "fallback_traditional_painting",
    name: "Pattachitra Traditional Heritage Folk Painting",
    title: "Pattachitra Traditional Heritage Folk Painting",
    category: "Paintings & Folk Art",
    price: 3200,
    costPrice: 1350,
    materialCost: 600,
    labourCost: 700,
    packagingCost: 50,
    otherCost: 0,
    material: "Treated Cotton Canvas & Mineral Pigments",
    craftType: "Pattachitra Painting",
    stock: 4,
    status: "Market-Ready",
    description: "Exquisite hand-painted Indian folk painting depicting mythological motifs with natural stone pigments, tamarind seed paste binder, and fine squirrel-hair brush strokes.",
    story: "Painted by master Chitrakar painters preserving 800-year-old scroll painting traditions.",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
    tags: ["Pattachitra", "FolkArt", "TraditionalPainting", "HeritageDecor", "IndianArt"],
    isDemoFallback: true
  }
];

export const mockProducts = [
  ...demoFallbackProducts,
  {
    id: "prod_1",
    name: "Hand-Painted Jaipur Blue Pottery Floral Vase",
    title: "Hand-Painted Jaipur Blue Pottery Floral Vase",
    category: "Pottery & Ceramics",
    price: 1450,
    costPrice: 620,
    laborHours: 6.5,
    suggestedPriceMin: 1350,
    suggestedPriceMax: 1650,
    stock: 12,
    salesCount: 28,
    views: 340,
    status: "Market-Ready",
    story: "Handcrafted using traditional quartz powder, raw clay, and natural cobalt oxide dye. Molded by hand in Kutch without a potter wheel.",
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80",
    aiStudioStatus: "Enhanced",
    tags: ["Handmade", "Eco-Friendly", "Home Decor", "Pottery"]
  },
  {
    id: "prod_2",
    name: "Terracotta Decorative Diya & Candle Holder Set",
    title: "Terracotta Decorative Diya & Candle Holder Set",
    category: "Festive Craft",
    price: 680,
    costPrice: 280,
    laborHours: 3.0,
    suggestedPriceMin: 650,
    suggestedPriceMax: 800,
    stock: 45,
    salesCount: 110,
    views: 890,
    status: "Market-Ready",
    story: "Fired in a traditional wood-burning furnace. Features hand-carved floral cutouts that radiate warm ambient light.",
    image: "https://images.unsplash.com/photo-1605883705077-8d3d3a71b12b?auto=format&fit=crop&w=600&q=80",
    aiStudioStatus: "Enhanced",
    tags: ["Terracotta", "Festive", "Lighting", "Sustainable"]
  }
];

export const mockDashboardStats = {
  totalProducts: 14,
  marketReadyCount: 11,
  totalViews: 2160,
  monthlySales: "₹ 34,800",
  growthRate: "+18% vs last month"
};

export const mockCategories = [
  "All Crafts",
  "Pottery & Ceramics",
  "Festive Craft",
  "Textiles & Apparel",
  "Wood Crafts",
  "Bags & Accessories",
  "Paintings & Folk Art",
  "Jewelry & Metalware"
];

export default {
  mockArtisanProfile,
  demoFallbackProducts,
  mockProducts,
  mockDashboardStats,
  mockCategories,
};
