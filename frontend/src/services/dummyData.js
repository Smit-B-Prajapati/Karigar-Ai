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

// Demo fallback items removed per user request: new and existing accounts start with their own crafts only
export const demoFallbackProducts = [];

export const mockProducts = [
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
