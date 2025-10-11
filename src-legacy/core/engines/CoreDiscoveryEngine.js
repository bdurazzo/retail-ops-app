// Core Batch Pattern Discovery Engine
// Handles 38K products in batches with fuzzy/semantic matching

export class CoreDiscoveryEngine {
  constructor(options = {}) {
    this.options = {
      batchSize: options.batchSize || 2000,
      minThreshold: options.minThreshold || 50,
      maxPatternsPerRound: options.maxPatternsPerRound || 50,
      confidenceThreshold: options.confidenceThreshold || 0.3,
      includeFields: options.includeFields || ['title', 'description', 'categories', 'keywords'],
      ...options
    };
    
    this.patterns = new Map(); // Pattern storage
    this.processedBatches = 0;
    this.totalBatches = 0;
    this.currentPass = 1; // Pass 1 = broad, Pass 2+ = deep
    this.passResults = new Map(); // Store results by pass
  }

  // Main entry point - processes all products in batches
  async discoverPatterns(products) {
    console.log(`🔍 Starting Pattern Discovery on ${products.length} products`);
    console.log(`📦 Batch size: ${this.options.batchSize}, Min threshold: ${this.options.minThreshold}`);
    
    // Calculate batches
    this.totalBatches = Math.ceil(products.length / this.options.batchSize);
    this.processedBatches = 0;
    
    // Reset patterns for new analysis
    this.patterns.clear();
    
    // Process in batches
    for (let i = 0; i < products.length; i += this.options.batchSize) {
      const batch = products.slice(i, i + this.options.batchSize);
      await this.processBatch(batch, i / this.options.batchSize + 1);
      
      // Progress callback
      this.onBatchComplete?.(this.processedBatches, this.totalBatches);
    }
    
    // Consolidate and rank patterns
    const consolidatedPatterns = this.consolidatePatterns();
    const rankedPatterns = this.rankPatterns(consolidatedPatterns);
    
    console.log(`✅ Pass ${this.currentPass} complete: ${rankedPatterns.length} patterns discovered`);
    
    // Store results for this pass
    this.passResults.set(this.currentPass, {
      patterns: rankedPatterns,
      timestamp: new Date().toISOString(),
      batchCount: this.totalBatches,
      productCount: products.length
    });
    
    return rankedPatterns;
  }

  // Process a single batch of products
  async processBatch(products, batchNumber) {
    console.log(`📦 Processing batch ${batchNumber}/${this.totalBatches} (${products.length} products)`);
    
    const batchPatterns = new Map();
    
    for (const product of products) {
      const extractedWords = this.extractWords(product);
      
      for (const word of extractedWords) {
        const normalizedWord = this.normalizeWord(word.original); // FIXED: use word.original
        if (this.isValidWord(normalizedWord)) {
          if (!batchPatterns.has(normalizedWord)) {
            batchPatterns.set(normalizedWord, {
              word: normalizedWord,
              originalVariations: new Set([word.original]),
              count: 0,
              products: new Set(),
              contexts: new Set(),
              fields: new Set(),
              priceRange: { min: Infinity, max: 0, values: [] },
              semanticVariants: new Set()
            });
          }
          
          const pattern = batchPatterns.get(normalizedWord);
          pattern.count++;
          pattern.products.add(product.product_id);
          pattern.originalVariations.add(word.original);
          pattern.contexts.add(word.context);
          pattern.fields.add(word.field);
          
          // Price analysis
          if (product.price && product.price > 0) {
            pattern.priceRange.min = Math.min(pattern.priceRange.min, product.price);
            pattern.priceRange.max = Math.max(pattern.priceRange.max, product.price);
            pattern.priceRange.values.push(product.price);
          }
          
          // Semantic variant detection
          this.findSemanticVariants(normalizedWord, word.original, pattern);
        }
      }
    }
    
    // Merge batch patterns into global patterns
    this.mergeBatchPatterns(batchPatterns);
    
    this.processedBatches++;
  }

  // Extract all words from product with context
  extractWords(product) {
    const words = [];
    
    for (const field of this.options.includeFields) {
      const value = product[field];
      if (!value) continue;
      
      const fieldWords = this.extractFromField(value, field);
      words.push(...fieldWords);
    }
    
    return words;
  }

  // Extract words from a specific field
  extractFromField(value, fieldName) {
    const words = [];
    let text = '';
    
    // Handle different field types
    if (typeof value === 'string') {
      text = value;
    } else if (Array.isArray(value)) {
      text = value.join(' ');
    } else if (typeof value === 'object') {
      text = JSON.stringify(value);
    } else {
      text = String(value);
    }
    
    // Extract words with fuzzy boundaries
    const wordMatches = text.match(/\b[\w'-]+\b/g) || [];
    
    for (const match of wordMatches) {
      // Context extraction - get surrounding words
      const index = text.indexOf(match);
      const contextStart = Math.max(0, index - 20);
      const contextEnd = Math.min(text.length, index + match.length + 20);
      const context = text.slice(contextStart, contextEnd).trim();
      
      words.push({
        original: match,
        normalized: this.normalizeWord(match),
        context: context,
        field: fieldName,
        position: index
      });
    }
    
    return words;
  }

  // Normalize word for matching
  normalizeWord(word) {
    return word
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Keep letters, numbers, spaces, hyphens
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Validate if word is worth analyzing
  isValidWord(word) {
    // Skip common stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);
    
    // Skip if too short, too long, or stop word
    if (word.length < 2 || word.length > 50 || stopWords.has(word)) {
      return false;
    }
    
    // Skip if purely numeric
    if (/^\d+$/.test(word)) {
      return false;
    }
    
    return true;
  }

  // Find semantic variants using fuzzy matching
  findSemanticVariants(normalizedWord, originalWord, pattern) {
    // Simple fuzzy matching - can be enhanced with more sophisticated algorithms
    const variants = [
      // Plural/singular variants
      normalizedWord.endsWith('s') ? normalizedWord.slice(0, -1) : normalizedWord + 's',
      
      // Common variations
      normalizedWord.replace('colour', 'color'),
      normalizedWord.replace('color', 'colour'),
      normalizedWord.replace('grey', 'gray'),
      normalizedWord.replace('gray', 'grey'),
      
      // Remove common suffixes/prefixes
      normalizedWord.replace(/^un/, ''),
      normalizedWord.replace(/ing$/, ''),
      normalizedWord.replace(/ed$/, ''),
      normalizedWord.replace(/er$/, ''),
      normalizedWord.replace(/ly$/, '')
    ];
    
    for (const variant of variants) {
      if (variant !== normalizedWord && variant.length > 1) {
        pattern.semanticVariants.add(variant);
      }
    }
  }

  // Merge batch patterns into global patterns
  mergeBatchPatterns(batchPatterns) {
    for (const [word, batchPattern] of batchPatterns) {
      if (!this.patterns.has(word)) {
        this.patterns.set(word, {
          ...batchPattern,
          originalVariations: new Set(batchPattern.originalVariations),
          products: new Set(batchPattern.products),
          contexts: new Set(batchPattern.contexts),
          fields: new Set(batchPattern.fields),
          semanticVariants: new Set(batchPattern.semanticVariants),
          priceRange: {
            ...batchPattern.priceRange,
            values: [...batchPattern.priceRange.values]
          }
        });
      } else {
        const globalPattern = this.patterns.get(word);
        
        // Merge counts and sets
        globalPattern.count += batchPattern.count;
        
        for (const variation of batchPattern.originalVariations) {
          globalPattern.originalVariations.add(variation);
        }
        
        for (const productId of batchPattern.products) {
          globalPattern.products.add(productId);
        }
        
        for (const context of batchPattern.contexts) {
          globalPattern.contexts.add(context);
        }
        
        for (const field of batchPattern.fields) {
          globalPattern.fields.add(field);
        }
        
        for (const variant of batchPattern.semanticVariants) {
          globalPattern.semanticVariants.add(variant);
        }
        
        // Merge price ranges
        globalPattern.priceRange.min = Math.min(globalPattern.priceRange.min, batchPattern.priceRange.min);
        globalPattern.priceRange.max = Math.max(globalPattern.priceRange.max, batchPattern.priceRange.max);
        globalPattern.priceRange.values.push(...batchPattern.priceRange.values);
      }
    }
  }

  // Consolidate patterns and calculate advanced metrics
  consolidatePatterns() {
    const consolidated = [];
    
    for (const [word, pattern] of this.patterns) {
      // Skip patterns below threshold
      if (pattern.count < this.options.minThreshold) continue;
      
      // Calculate advanced metrics
      const metrics = this.calculatePatternMetrics(pattern);
      
      consolidated.push({
        word: word,
        count: pattern.count,
        uniqueProducts: pattern.products.size,
        variations: Array.from(pattern.originalVariations),
        contexts: Array.from(pattern.contexts).slice(0, 3), // Sample contexts
        fields: Array.from(pattern.fields),
        semanticVariants: Array.from(pattern.semanticVariants),
        metrics: metrics,
        confidence: this.calculateConfidence(pattern, metrics)
      });
    }
    
    return consolidated;
  }

  // Calculate pattern metrics
  calculatePatternMetrics(pattern) {
    const priceValues = pattern.priceRange.values.filter(p => p > 0);
    
    return {
      frequency: pattern.count,
      productPenetration: pattern.products.size,
      variationCount: pattern.originalVariations.size,
      fieldSpread: pattern.fields.size,
      priceCorrelation: priceValues.length > 0 ? {
        min: Math.min(...priceValues),
        max: Math.max(...priceValues),
        avg: priceValues.reduce((a, b) => a + b, 0) / priceValues.length,
        hasPrice: priceValues.length
      } : null,
      semanticRichness: pattern.semanticVariants.size
    };
  }

  // Calculate confidence score for pattern
  calculateConfidence(pattern, metrics) {
    let confidence = 0;
    
    // Frequency weight (higher frequency = higher confidence)
    confidence += Math.min(metrics.frequency / 100, 1) * 0.3;
    
    // Product penetration weight
    confidence += Math.min(metrics.productPenetration / 1000, 1) * 0.2;
    
    // Field spread weight (appears across multiple fields = higher confidence)
    confidence += Math.min(metrics.fieldSpread / 4, 1) * 0.2;
    
    // Variation consistency (multiple variations = more likely to be important)
    confidence += Math.min(metrics.variationCount / 5, 1) * 0.15;
    
    // Price correlation (items with prices = more structured data)
    if (metrics.priceCorrelation) {
      confidence += 0.1;
    }
    
    // Semantic richness
    confidence += Math.min(metrics.semanticRichness / 10, 1) * 0.05;
    
    return Math.min(confidence, 1); // Cap at 1.0
  }

  // Rank patterns by relevance and confidence
  rankPatterns(patterns) {
    return patterns
      .filter(p => p.confidence >= this.options.confidenceThreshold)
      .sort((a, b) => {
        // Primary sort: confidence
        if (Math.abs(a.confidence - b.confidence) > 0.1) {
          return b.confidence - a.confidence;
        }
        
        // Secondary sort: frequency
        return b.count - a.count;
      })
      .slice(0, this.options.maxPatternsPerRound);
  }

  // Get patterns ready for survey
  getPatternsForSurvey() {
    const currentPassResults = this.passResults.get(this.currentPass);
    if (!currentPassResults) return [];
    
    return currentPassResults.patterns.map(pattern => ({
      id: `${this.currentPass}-${pattern.word}`,
      word: pattern.word,
      count: pattern.count,
      uniqueProducts: pattern.uniqueProducts,
      variations: pattern.variations,
      contexts: pattern.contexts,
      confidence: pattern.confidence,
      reasoning: this.generateReasoning(pattern),
      suggestedClassifications: this.suggestClassifications(pattern)
    }));
  }

  // Generate human-readable reasoning for pattern
  generateReasoning(pattern) {
    const reasons = [];
    
    if (pattern.count > 100) {
      reasons.push(`High frequency (${pattern.count} occurrences)`);
    } else if (pattern.count > 50) {
      reasons.push(`Medium frequency (${pattern.count} occurrences)`);
    }
    
    if (pattern.uniqueProducts > 100) {
      reasons.push(`appears across ${pattern.uniqueProducts} products`);
    }
    
    if (pattern.fields.length > 2) {
      reasons.push(`found in multiple fields (${pattern.fields.join(', ')})`);
    }
    
    if (pattern.metrics.priceCorrelation) {
      const price = pattern.metrics.priceCorrelation;
      reasons.push(`price range $${price.min.toFixed(0)}-$${price.max.toFixed(0)}`);
    }
    
    if (pattern.variations.length > 3) {
      reasons.push(`multiple variations (${pattern.variations.slice(0, 3).join(', ')}...)`);
    }
    
    return reasons.join(' + ');
  }

  // Suggest likely classifications based on pattern analysis
  suggestClassifications(pattern) {
    const suggestions = [];
    const word = pattern.word.toLowerCase();
    
    // Material suggestions
    if (['leather', 'canvas', 'wool', 'cotton', 'silk', 'denim', 'nylon'].includes(word)) {
      suggestions.push({ type: 'Material', confidence: 0.9 });
    }
    
    // Product type suggestions
    if (['jacket', 'shirt', 'pants', 'bag', 'boot', 'hat'].includes(word)) {
      suggestions.push({ type: 'Category', confidence: 0.8 });
      suggestions.push({ type: 'Subcategory', confidence: 0.6 });
    }
    
    // Color suggestions
    if (['black', 'white', 'brown', 'navy', 'gray', 'red', 'blue', 'green'].includes(word)) {
      suggestions.push({ type: 'Color', confidence: 0.9 });
    }
    
    // Size suggestions
    if (['small', 'medium', 'large', 'xl', 'xxl', 'xs'].includes(word)) {
      suggestions.push({ type: 'Size', confidence: 0.9 });
    }
    
    // Feature suggestions
    if (['waterproof', 'insulated', 'lined', 'vintage', 'classic'].includes(word)) {
      suggestions.push({ type: 'Feature', confidence: 0.7 });
    }
    
    // Default suggestion
    if (suggestions.length === 0) {
      suggestions.push({ type: 'Attribute', confidence: 0.4 });
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // Progress callback setter
  onBatchComplete(callback) {
    this.onBatchComplete = callback;
  }

  // Get current progress
  getProgress() {
    return {
      currentPass: this.currentPass,
      batchesProcessed: this.processedBatches,
      totalBatches: this.totalBatches,
      patternsFound: this.patterns.size,
      passResults: Array.from(this.passResults.entries())
    };
  }
}

// Usage function for testing
export async function testCoreEngine() {
  console.log('🚀 Testing Core Discovery Engine...');
  
  // Import catalog data
  const { CatalogRepository } = await import('../../features/catalog/repositories/CatalogRepository');
  const catalog = await CatalogRepository.loadCurrentCatalog(false);
  
  // Create engine with test settings
  const engine = new CoreDiscoveryEngine({
    batchSize: 1000,
    minThreshold: 10, // Lower threshold for testing
    maxPatternsPerRound: 20 // Fewer patterns for easier testing
  });
  
  // Set up progress monitoring
  engine.onBatchComplete = (processed, total) => {
    console.log(`📊 Progress: ${processed}/${total} batches (${((processed/total)*100).toFixed(1)}%)`);
  };
  
  // Run discovery
  const patterns = await engine.discoverPatterns(catalog.products);
  
  // Get patterns for survey
  const surveyPatterns = engine.getPatternsForSurvey();
  
  console.log('🎯 Top Patterns Discovered:');
  surveyPatterns.slice(0, 10).forEach((pattern, i) => {
    console.log(`${i+1}. "${pattern.word}" (${pattern.count}x, confidence: ${(pattern.confidence*100).toFixed(1)}%)`);
    console.log(`   Reasoning: ${pattern.reasoning}`);
    console.log(`   Suggestions: ${pattern.suggestedClassifications.map(s => `${s.type} (${(s.confidence*100).toFixed(0)}%)`).join(', ')}`);
  });
  
  return { engine, patterns: surveyPatterns };
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  window.testCoreEngine = testCoreEngine;
}