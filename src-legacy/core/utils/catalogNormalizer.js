// src/core/utils/catalogNormalizer.js
// Follows same pattern as ordersNormalizer.js

function toNumber(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v == null) return 0;
  if (typeof v === "string") {
    const n = Number(v.replace(/[$,]/g, "").trim());
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseImages(imagesField) {
  try {
    if (!imagesField || typeof imagesField !== 'string') return [];
    const parsed = JSON.parse(imagesField);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to parse images field:', e.message);
    return [];
  }
}

function parseExtendedAttributes(attributesField) {
  try {
    if (!attributesField || typeof attributesField !== 'string') return {};
    const parsed = JSON.parse(attributesField);
    return Array.isArray(parsed) ? parsed.reduce((acc, attr) => {
      if (attr.name && attr.value) {
        acc[attr.name] = attr.value;
      }
      return acc;
    }, {}) : {};
  } catch (e) {
    console.warn('Failed to parse extended attributes:', e.message);
    return {};
  }
}

function parseExternalIdentifiers(identifiersField) {
  try {
    if (!identifiersField || typeof identifiersField !== 'string') return {};
    const arr = JSON.parse(identifiersField);
    if (!Array.isArray(arr)) return {};
    const out = {};
    for (const rec of arr) {
      const t = (rec?.type || rec?.Type || '').toString().toLowerCase();
      const v = rec?.value || rec?.Value || '';
      if (!t || !v) continue;
      if (t === 'sku') out.sku = String(v);
      if (t === 'upc') out.upc = String(v);
    }
    return out;
  } catch (e) {
    console.warn('Failed to parse external_identifiers:', e.message);
    return {};
  }
}

function extractGender(title) {
  if (!title) return 'Unisex';
  const titleUpper = title.toUpperCase();
  if (titleUpper.startsWith("W'S ") || titleUpper.includes("WOMEN'S")) return 'Women';
  if (titleUpper.startsWith("M'S ") || titleUpper.includes("MEN'S")) return 'Men';
  return 'Unisex';
}

function extractCategory(title) {
  if (!title) return 'Other';
  const titleUpper = title.toUpperCase();
  
  const categoryMap = {
    'CRUISER': 'Jackets',
    'JAC-SHIRT': 'Shirts',
    'JACKET': 'Jackets',
    'COAT': 'Jackets', 
    'SHIRT': 'Shirts',
    'PANTS': 'Bottoms',
    'WORK PANTS': 'Bottoms',
    'FIELD PANT': 'Bottoms',
    'SHORTS': 'Bottoms',
    'T-SHIRT': 'Shirts',
    'TEE': 'Shirts',
    'CREWNECK': 'Shirts',
    'HOODIE': 'Shirts',
    'HOODED': 'Shirts',
    'BAG': 'Accessories',
    'DUFFLE': 'Accessories', 
    'BELT': 'Accessories',
    'CARDIGAN': 'Sweaters',
    'SWEATER': 'Sweaters',
    'SWEATSHIRT': 'Sweaters',
    'SWEATPANT': 'Bottoms'
  };

  for (const [pattern, category] of Object.entries(categoryMap)) {
    if (titleUpper.includes(pattern)) {
      return category;
    }
  }
  
  return 'Other';
}

function extractMaterial(title, description = '') {
  if (!title) return null;
  const text = `${title} ${description}`.toUpperCase();
  
  const materials = [
    'MACKINAW WOOL',
    'TIN CLOTH', 
    'CANVAS',
    'SHELTER CLOTH',
    'RUGGED TWILL',
    'FLANNEL',
    'WOOL',
    'COTTON'
  ];
  
  for (const material of materials) {
    if (text.includes(material)) {
      return material;
    }
  }
  
  return null;
}

function extractStyle(title) {
  if (!title) return null;
  const titleUpper = title.toUpperCase();
  
  // Extract the main style/product type
  const styles = [
    'SHORT LINED CRUISER',
    'MACKINAW CRUISER', 
    'MACKINAW WOOL CRUISER',
    'LINED WOOL PACKER COAT',
    'MACKINAW WOOL JAC-SHIRT',
    'JAC-SHIRT',
    'VINTAGE FLANNEL WORK SHIRT',
    'ALASKAN GUIDE SHIRT',
    'CANVAS WORK PANTS',
    'MACKINAW FIELD PANT',
    'DOUBLE TIN PANT'
  ];
  
  for (const style of styles) {
    if (titleUpper.includes(style)) {
      return style;
    }
  }
  
  // Fallback to product type
  if (titleUpper.includes('CRUISER')) return 'CRUISER';
  if (titleUpper.includes('JAC-SHIRT')) return 'JAC-SHIRT';
  if (titleUpper.includes('WORK SHIRT')) return 'WORK SHIRT';
  if (titleUpper.includes('WORK PANTS')) return 'WORK PANTS';
  
  return null;
}

export function normalizeCatalogRow(row) {
  try {
    const out = {};
    
    // Core product info
    out.product_id = String(row.product_id || '').trim();
    out.variant_group_id = String(row.variant_group_id || '').trim();
    out.title = String(row.title || '').trim();
    out.brand = String(row.brand || 'Filson').trim();
    out.caption = String(row.caption || '').trim();
    out.description = String(row.description || '').trim();
    
    // Availability and pricing
    out.is_available = Boolean(row.is_available);
    out.price = toNumber(row.price);
    out.currency = String(row.currency || 'USD').trim();
    // External identifiers (SKU/UPC)
    const ids = parseExternalIdentifiers(row.external_identifiers);
    out.sku = ids.sku || '';
    out.upc = ids.upc || '';

    // Variations (size, color)
    out.color = String(row.variation_color_value || '').trim();
    out.size = String(row.variation_size_value || '').trim();
    out.size_gender = String(row.variation_size_gender || '').trim();
    out.size_type = String(row.variation_size_type || '').trim();
    out.size_system = String(row.variation_size_system || '').trim();
    out.size_sort_position = toNumber(row.variation_size_sort_position);
    
    // Additional variations
    out.variation_additional_1_name = String(row.variation_additional_1_name || '').trim();
    out.variation_additional_1_value = String(row.variation_additional_1_value || '').trim();
    out.variation_additional_2_name = String(row.variation_additional_2_name || '').trim();
    out.variation_additional_2_value = String(row.variation_additional_2_value || '').trim();
    
    // Parse complex JSON fields
    out.images = parseImages(row.images);
    out.extended_attributes = parseExtendedAttributes(row.extended_attributes);
    
    // Extract classification data
    out.gender = extractGender(out.title);
    out.category = extractCategory(out.title);
    out.material = extractMaterial(out.title, out.description);
    out.style = extractStyle(out.title);
    
    // Create search-friendly fields
    out.searchText = [
      out.title,
      out.brand,
      out.color,
      out.size,
      out.category,
      out.style,
      out.material
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Product availability attributes from extended_attributes
    const attrs = out.extended_attributes;
    out.final_sale = attrs.final_sale === 'true';
    out.employee_discount_amount = attrs.employee_discount_amount || null;
    
    // Shipping and inventory
    out.shipping_weight_value = toNumber(row.shipping_weight_value);
    out.shipping_weight_unit = String(row.shipping_weight_unit || 'lb').trim();
    out.inventory_tracked = Boolean(row.inventory_tracked);
    out.serialized_inventory = Boolean(row.serialized_inventory);
    out.variable_pricing = Boolean(row.variable_pricing);
    
    // Tax and country info  
    out.tax_class_id = String(row.tax_class_id || '').trim();
    out.country_of_origin = String(row.country_of_origin || '').trim();
    
    // Timestamps
    out.updated_at = String(row.updated_at || '').trim();
    
    return out;
    
  } catch (error) {
    console.error('Error normalizing catalog row:', error.message, row);
    // Return minimal valid row even if normalization fails
    return {
      product_id: String(row.product_id || ''),
      sku: '',
      title: String(row.title || 'Unknown Product'),
      brand: 'Filson',
      price: toNumber(row.price),
      currency: 'USD',
      color: String(row.variation_color_value || ''),
      size: String(row.variation_size_value || ''),
      is_available: Boolean(row.is_available),
      category: 'Other',
      gender: 'Unisex',
      searchText: String(row.title || '').toLowerCase()
    };
  }
}
