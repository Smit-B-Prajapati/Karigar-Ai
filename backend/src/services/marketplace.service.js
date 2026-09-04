/**
 * Standardize product data into clean e-commerce catalogue export format
 * @param {object} product 
 * @param {object} artisan 
 * @returns {object}
 */
export function formatProductForExport(product, artisan = {}) {
  const prodId = product._id ? product._id.toString() : product.id || 'ITEM-001';
  const sku = `KARIGAR-${(product.category || 'CRAFT').replace(/\s+/g, '-').toUpperCase().substring(0, 8)}-${prodId.substring(Math.max(0, prodId.length - 6))}`;

  return {
    sku,
    title: product.name || 'Artisan Handicraft',
    description: product.description || '',
    category: product.category || 'Handicraft & Traditional Decor',
    material: product.material || 'Natural Organic Material',
    craftType: product.craftType || 'Traditional Artisan Craft',
    pricing: {
      currency: 'INR',
      sellingPrice: product.price || 0,
      materialCost: product.materialCost || 0,
      labourCost: product.labourCost || 0,
      packagingCost: product.packagingCost || 0,
      otherCost: product.otherCost || 0,
    },
    inventory: {
      status: product.status === 'Published' || product.status === 'Market-Ready' ? 'In Stock (Made-to-Order / Ready)' : 'Draft (Unpublished)',
      quantity: 1,
    },
    images: {
      primaryImage: product.enhancedImage || product.originalImage || '',
      originalImage: product.originalImage || '',
      enhancedImage: product.enhancedImage || '',
    },
    tags: Array.isArray(product.tags) ? product.tags : [],
    location: product.location || artisan.location || 'India (Artisan Craft Cluster)',
    seller: {
      artisanName: artisan.name || product.artisan?.name || 'Master Artisan',
      email: artisan.email || product.artisan?.email || '',
      craftSpecialty: artisan.craftSpecialty || product.craftType || 'Traditional Handicrafts',
      isVerifiedArtisan: true,
    },
    compliance: {
      authenticity: '100% Handcrafted by Indian Artisan',
      standard: 'Artisanal Direct Producer Direct-to-Consumer Spec',
      exportFormatVersion: '1.0.0',
    },
    metadata: {
      productId: prodId,
      exportedAt: new Date().toISOString(),
      platform: 'KarigarAI Producer Network',
    },
  };
}

/**
 * Generate structured JSON export of entire artisan product catalogue
 * @param {Array} products 
 * @param {object} artisan 
 * @returns {object}
 */
export function exportCatalogueJson(products = [], artisan = {}) {
  const formattedItems = products.map((p) => formatProductForExport(p, artisan));

  return {
    catalogueMeta: {
      artisanId: artisan._id ? artisan._id.toString() : 'artisan-001',
      artisanName: artisan.name || 'Master Artisan',
      totalItems: formattedItems.length,
      exportedAt: new Date().toISOString(),
      specification: 'KarigarAI Open Standard Catalogue Format v1.0',
    },
    products: formattedItems,
  };
}

/**
 * Generate RFC 4180 compliant CSV export
 * @param {Array} products 
 * @param {object} artisan 
 * @returns {string}
 */
export function exportCatalogueCsv(products = [], artisan = {}) {
  const headers = [
    'SKU',
    'Title',
    'Category',
    'Craft Technique',
    'Material',
    'Price (INR)',
    'Status',
    'Tags',
    'Artisan Name',
    'Location',
    'Primary Image URL',
    'Description',
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = products.map((p) => {
    const formatted = formatProductForExport(p, artisan);
    return [
      escapeCsv(formatted.sku),
      escapeCsv(formatted.title),
      escapeCsv(formatted.category),
      escapeCsv(formatted.craftType),
      escapeCsv(formatted.material),
      escapeCsv(formatted.pricing.sellingPrice),
      escapeCsv(formatted.inventory.status),
      escapeCsv(formatted.tags.join(', ')),
      escapeCsv(formatted.seller.artisanName),
      escapeCsv(formatted.location),
      escapeCsv(formatted.images.primaryImage),
      escapeCsv(formatted.description),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export default {
  formatProductForExport,
  exportCatalogueJson,
  exportCatalogueCsv,
};
