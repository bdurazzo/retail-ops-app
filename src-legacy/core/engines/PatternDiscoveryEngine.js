// Product Pattern Discovery Engine
// Analyzes 38K products to find natural categories, attributes, and filtering patterns

export class PatternDiscoveryEngine {
  constructor() {
    this.analysis = {
      // Core patterns
      titlePatterns: new Map(),
      priceRanges: new Map(),
      colorVariants: new Map(),
      sizeVariants: new Map(),
      materialKeywords: new Map(),
      
      // Category discovery
      categoryKeywords: new Map(),
      subcategoryPatterns: new Map(),
      brandPatterns: new Map(),
      
      // Attribute extraction
      extractedAttributes: new Map(),
      commonAdjectives: new Map(),
      productTypes: new Map(),
      
      // Statistical analysis
      stats: {
        totalProducts: 0,
        priceStats: { min: Infinity, max: 0, average: 0, median: 0 },
        titleLengthStats: { min: Infinity, max: 0, average: 0 },
        missingData: new Map()
      }
    };
  }

  async analyzeFullCatalog(products) {
    console.log('🔍 Starting Pattern Discovery on', products.length, 'products...');
    const startTime = performance.now();
    
    this.analysis.stats.totalProducts = products.length;
    
    // Phase 1: Basic data extraction
    console.log('📊 Phase 1: Extracting basic patterns...');
    this.extractBasicPatterns(products);
    
    // Phase 2: Advanced pattern recognition
    console.log('🧠 Phase 2: Advanced pattern recognition...');
    this.recognizeAdvancedPatterns(products);
    
    // Phase 3: Category discovery
    console.log('📂 Phase 3: Category discovery...');
    this.discoverCategories(products);
    
    // Phase 4: Attribute mining
    console.log('⚙️ Phase 4: Attribute mining...');
    this.mineAttributes(products);
    
    // Phase 5: Statistical analysis
    console.log('📈 Phase 5: Statistical analysis...');
    this.calculateStatistics(products);
    
    const duration = performance.now() - startTime;
    console.log(`✅ Pattern discovery complete in ${duration.toFixed(2)}ms`);
    
    return this.generateDiscoveryReport();
  }

  extractBasicPatterns(products) {
    const prices = [];
    const titleLengths = [];
    
    for (const product of products) {
      // Title pattern analysis
      if (product.title) {
        const words = product.title.toLowerCase().split(/\s+/);
        titleLengths.push(product.title.length);
        
        words.forEach(word => {
          // Clean word
          const cleanWord = word.replace(/[^\w]/g, '');
          if (cleanWord.length > 2) {
            this.analysis.titlePatterns.set(cleanWord, 
              (this.analysis.titlePatterns.get(cleanWord) || 0) + 1);
          }
        });
      }
      
      // Price analysis
      if (product.price && product.price > 0) {
        prices.push(product.price);
        
        // Price range buckets
        const range = this.getPriceRange(product.price);
        this.analysis.priceRanges.set(range, 
          (this.analysis.priceRanges.get(range) || 0) + 1);
      }
      
      // Color variants
      if (product.color) {
        this.analysis.colorVariants.set(product.color,
          (this.analysis.colorVariants.get(product.color) || 0) + 1);
      }
      
      // Size variants  
      if (product.size) {
        this.analysis.sizeVariants.set(product.size,
          (this.analysis.sizeVariants.get(product.size) || 0) + 1);
      }
      
      // Material keywords (from description/title)
      this.extractMaterialKeywords(product);
    }
    
    // Store for statistics
    this.pricesArray = prices;
    this.titleLengthsArray = titleLengths;
  }

  recognizeAdvancedPatterns(products) {
    // Common product type patterns
    const typePatterns = [
      // Clothing
      { pattern: /\b(jacket|coat|parka|vest|sweater|shirt|pants|jeans|shorts|dress|skirt|blouse)\b/i, category: 'Clothing' },
      
      // Accessories  
      { pattern: /\b(bag|backpack|tote|wallet|belt|hat|cap|gloves|scarf|watch|sunglasses)\b/i, category: 'Accessories' },
      
      // Footwear
      { pattern: /\b(boot|shoe|sneaker|sandal|loafer|oxford|heel|pump)\b/i, category: 'Footwear' },
      
      // Outdoor/Gear
      { pattern: /\b(tent|sleeping|camping|hiking|fishing|hunting|outdoor|gear|equipment)\b/i, category: 'Outdoor' },
      
      // Home goods
      { pattern: /\b(blanket|pillow|towel|sheet|curtain|rug|candle|lamp)\b/i, category: 'Home' }
    ];
    
    for (const product of products) {
      const text = `${product.title || ''} ${product.description || ''}`.toLowerCase();
      
      typePatterns.forEach(({ pattern, category }) => {
        if (pattern.test(text)) {
          this.analysis.productTypes.set(category,
            (this.analysis.productTypes.get(category) || 0) + 1);
        }
      });
    }
  }

  discoverCategories(products) {
    // Analyze title structures to find category patterns
    const titleStructures = new Map();
    
    for (const product of products) {
      if (!product.title) continue;
      
      const words = product.title.toLowerCase().split(/\s+/);
      
      // Look for common first/last words (often indicate product type)
      if (words.length > 0) {
        const firstWord = words[0];
        const lastWord = words[words.length - 1];
        
        this.analysis.categoryKeywords.set(`first:${firstWord}`,
          (this.analysis.categoryKeywords.get(`first:${firstWord}`) || 0) + 1);
          
        this.analysis.categoryKeywords.set(`last:${lastWord}`,
          (this.analysis.categoryKeywords.get(`last:${lastWord}`) || 0) + 1);
      }
      
      // Look for common 2-word combinations
      for (let i = 0; i < words.length - 1; i++) {
        const combo = `${words[i]} ${words[i + 1]}`;
        this.analysis.subcategoryPatterns.set(combo,
          (this.analysis.subcategoryPatterns.get(combo) || 0) + 1);
      }
    }
  }

  mineAttributes(products) {
    const attributePatterns = [
      // Size attributes
      { pattern: /\b(small|medium|large|xl|xxl|xs|[0-9]+["\']|size\s*[0-9]+)\b/i, type: 'size' },
      
      // Color attributes  
      { pattern: /\b(black|white|red|blue|green|yellow|brown|gray|grey|navy|khaki|tan|burgundy|olive)\b/i, type: 'color' },
      
      // Material attributes
      { pattern: /\b(cotton|wool|leather|canvas|denim|silk|polyester|nylon|fleece|cashmere|linen)\b/i, type: 'material' },
      
      // Style attributes
      { pattern: /\b(vintage|modern|classic|casual|formal|sporty|outdoor|urban|rustic)\b/i, type: 'style' },
      
      // Fit attributes
      { pattern: /\b(slim|regular|loose|tight|fitted|relaxed|stretch|tailored)\b/i, type: 'fit' }
    ];
    
    for (const product of products) {
      const text = `${product.title || ''} ${product.description || ''}`.toLowerCase();
      
      attributePatterns.forEach(({ pattern, type }) => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const key = `${type}:${match.trim()}`;
            this.analysis.extractedAttributes.set(key,
              (this.analysis.extractedAttributes.get(key) || 0) + 1);
          });
        }
      });
    }
  }

  extractMaterialKeywords(product) {
    const materials = [
      'cotton', 'wool', 'leather', 'canvas', 'denim', 'silk', 'polyester', 
      'nylon', 'fleece', 'cashmere', 'linen', 'bamboo', 'hemp', 'twill'
    ];
    
    const text = `${product.title || ''} ${product.description || ''}`.toLowerCase();
    
    materials.forEach(material => {
      if (text.includes(material)) {
        this.analysis.materialKeywords.set(material,
          (this.analysis.materialKeywords.get(material) || 0) + 1);
      }
    });
  }

  calculateStatistics(products) {
    // Price statistics
    if (this.pricesArray.length > 0) {
      this.pricesArray.sort((a, b) => a - b);
      this.analysis.stats.priceStats = {
        min: this.pricesArray[0],
        max: this.pricesArray[this.pricesArray.length - 1],
        average: this.pricesArray.reduce((a, b) => a + b, 0) / this.pricesArray.length,
        median: this.pricesArray[Math.floor(this.pricesArray.length / 2)]
      };
    }
    
    // Title length statistics
    if (this.titleLengthsArray.length > 0) {
      this.titleLengthsArray.sort((a, b) => a - b);
      this.analysis.stats.titleLengthStats = {
        min: this.titleLengthsArray[0],
        max: this.titleLengthsArray[this.titleLengthsArray.length - 1],
        average: this.titleLengthsArray.reduce((a, b) => a + b, 0) / this.titleLengthsArray.length,
        median: this.titleLengthsArray[Math.floor(this.titleLengthsArray.length / 2)]
      };
    }
    
    // Missing data analysis
    let missingTitle = 0, missingPrice = 0, missingColor = 0, missingSize = 0;
    
    products.forEach(product => {
      if (!product.title) missingTitle++;
      if (!product.price || product.price <= 0) missingPrice++;
      if (!product.color) missingColor++;
      if (!product.size) missingSize++;
    });
    
    this.analysis.stats.missingData.set('title', missingTitle);
    this.analysis.stats.missingData.set('price', missingPrice);
    this.analysis.stats.missingData.set('color', missingColor);
    this.analysis.stats.missingData.set('size', missingSize);
  }

  getPriceRange(price) {
    if (price < 25) return '$0-25';
    if (price < 50) return '$25-50';
    if (price < 100) return '$50-100';
    if (price < 200) return '$100-200';
    if (price < 500) return '$200-500';
    return '$500+';
  }

  generateDiscoveryReport() {
    const report = {
      overview: {
        totalProducts: this.analysis.stats.totalProducts,
        analysisTimestamp: new Date().toISOString(),
        priceRange: this.analysis.stats.priceStats,
        dataQuality: this.calculateDataQuality()
      },
      
      categories: this.generateCategoryReport(),
      attributes: this.generateAttributeReport(), 
      patterns: this.generatePatternReport(),
      recommendations: this.generateRecommendations()
    };
    
    // Pretty print the report
    this.printDiscoveryReport(report);
    
    return report;
  }

  generateCategoryReport() {
    return {
      discoveredTypes: this.getTopEntries(this.analysis.productTypes, 20),
      commonKeywords: this.getTopEntries(this.analysis.titlePatterns, 50),
      subcategories: this.getTopEntries(this.analysis.subcategoryPatterns, 30),
      priceRanges: this.getTopEntries(this.analysis.priceRanges, 10)
    };
  }

  generateAttributeReport() {
    return {
      colors: this.getTopEntries(this.analysis.colorVariants, 50),
      sizes: this.getTopEntries(this.analysis.sizeVariants, 30),
      materials: this.getTopEntries(this.analysis.materialKeywords, 20),
      extractedAttributes: this.getTopEntries(this.analysis.extractedAttributes, 100)
    };
  }

  generatePatternReport() {
    return {
      categoryPatterns: this.getTopEntries(this.analysis.categoryKeywords, 50),
      titleStatistics: this.analysis.stats.titleLengthStats,
      commonWords: this.getTopEntries(this.analysis.titlePatterns, 100)
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Category recommendations
    const topTypes = this.getTopEntries(this.analysis.productTypes, 10);
    recommendations.push({
      type: 'categories',
      suggestion: `Create main categories: ${topTypes.map(([cat]) => cat).join(', ')}`,
      confidence: 'high',
      impact: 'navigation improvement'
    });
    
    // Filter recommendations
    const topColors = this.getTopEntries(this.analysis.colorVariants, 20);
    const topSizes = this.getTopEntries(this.analysis.sizeVariants, 15);
    
    recommendations.push({
      type: 'filters',
      suggestion: `Primary color filters: ${topColors.slice(0, 10).map(([color]) => color).join(', ')}`,
      confidence: 'high',
      impact: 'search refinement'
    });
    
    recommendations.push({
      type: 'filters', 
      suggestion: `Size filters: ${topSizes.map(([size]) => size).join(', ')}`,
      confidence: 'high',
      impact: 'size selection'
    });
    
    // Price range recommendations
    const priceRanges = this.getTopEntries(this.analysis.priceRanges, 10);
    recommendations.push({
      type: 'pricing',
      suggestion: `Effective price ranges: ${priceRanges.map(([range]) => range).join(', ')}`,
      confidence: 'high', 
      impact: 'price filtering'
    });
    
    return recommendations;
  }

  calculateDataQuality() {
    const total = this.analysis.stats.totalProducts;
    const missing = this.analysis.stats.missingData;
    
    return {
      titleCompleteness: ((total - missing.get('title')) / total * 100).toFixed(1) + '%',
      priceCompleteness: ((total - missing.get('price')) / total * 100).toFixed(1) + '%',
      colorCompleteness: ((total - missing.get('color')) / total * 100).toFixed(1) + '%',
      sizeCompleteness: ((total - missing.get('size')) / total * 100).toFixed(1) + '%'
    };
  }

  getTopEntries(map, limit) {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  printDiscoveryReport(report) {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 PRODUCT PATTERN DISCOVERY REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📊 OVERVIEW:`);
    console.log(`   Total Products: ${report.overview.totalProducts.toLocaleString()}`);
    console.log(`   Price Range: $${report.overview.priceRange.min?.toFixed(2)} - $${report.overview.priceRange.max?.toFixed(2)}`);
    console.log(`   Average Price: $${report.overview.priceRange.average?.toFixed(2)}`);
    
    console.log(`\n📈 DATA QUALITY:`);
    Object.entries(report.overview.dataQuality).forEach(([field, completeness]) => {
      console.log(`   ${field}: ${completeness}`);
    });
    
    console.log(`\n📂 DISCOVERED CATEGORIES (Top 10):`);
    report.categories.discoveredTypes.slice(0, 10).forEach(([category, count], i) => {
      const pct = (count / report.overview.totalProducts * 100).toFixed(1);
      console.log(`   ${i + 1}. ${category}: ${count.toLocaleString()} (${pct}%)`);
    });
    
    console.log(`\n🎨 TOP COLORS (Top 15):`);
    report.attributes.colors.slice(0, 15).forEach(([color, count], i) => {
      console.log(`   ${i + 1}. ${color}: ${count.toLocaleString()}`);
    });
    
    console.log(`\n📏 TOP SIZES (Top 15):`);
    report.attributes.sizes.slice(0, 15).forEach(([size, count], i) => {
      console.log(`   ${i + 1}. ${size}: ${count.toLocaleString()}`);
    });
    
    console.log(`\n💰 PRICE DISTRIBUTION:`);
    report.categories.priceRanges.forEach(([range, count]) => {
      const pct = (count / report.overview.totalProducts * 100).toFixed(1);
      console.log(`   ${range}: ${count.toLocaleString()} (${pct}%)`);
    });
    
    console.log(`\n🔍 MOST COMMON KEYWORDS (Top 20):`);
    report.categories.commonKeywords.slice(0, 20).forEach(([word, count], i) => {
      console.log(`   ${i + 1}. "${word}": ${count.toLocaleString()}`);
    });
    
    console.log(`\n💡 RECOMMENDATIONS:`);
    report.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. [${rec.type.toUpperCase()}] ${rec.suggestion}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Pattern discovery complete! Use this data to build dynamic filters.');
    console.log('='.repeat(80));
  }
}

// Usage function
export async function discoverProductPatterns() {
  console.log('🚀 Starting Product Pattern Discovery...');
  
  // Import your catalog repository (adjusted path from core/engines)
  const { CatalogRepository } = await import('../../features/catalog/repositories/CatalogRepository');
  
  // Load the full catalog
  const catalog = await CatalogRepository.loadCurrentCatalog(false); // Production mode
  
  // Create discovery engine and analyze
  const engine = new PatternDiscoveryEngine();
  const report = await engine.analyzeFullCatalog(catalog.products);
  
  return report;
}

// Export for browser console testing
window.discoverProductPatterns = discoverProductPatterns;