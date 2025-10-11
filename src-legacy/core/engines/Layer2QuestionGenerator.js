// Layer 2 Dynamic Survey System
// Generates contextual follow-up questions based on pattern type and user responses

export class Layer2QuestionGenerator {
  constructor() {
    // Store user's custom classifications to learn patterns
    this.customClassifications = new Map();
    this.classificationPatterns = new Map();
    this.combinationSuggestions = new Map();
  }

  // Generate Layer 2 questions for a pattern the user marked YES
  generateLayer2Questions(pattern, discoveredCombinations = []) {
    const questions = [];
    const patternType = this.detectPatternType(pattern);
    
    // Base classification question (always first)
    questions.push(this.createClassificationQuestion(pattern, patternType));
    
    // Dynamic questions based on pattern type
    questions.push(...this.createTypeSpecificQuestions(pattern, patternType));
    
    // Combination suggestions (if found)
    if (discoveredCombinations.length > 0) {
      questions.push(this.createCombinationQuestion(pattern, discoveredCombinations));
    }
    
    // Expansion strategy question
    questions.push(this.createExpansionQuestion(pattern, patternType));
    
    // Learning question (appears after user has made similar classifications)
    const learningQuestion = this.createLearningQuestion(pattern);
    if (learningQuestion) {
      questions.push(learningQuestion);
    }
    
    return {
      patternId: pattern.id,
      patternWord: pattern.word,
      patternType: patternType,
      questions: questions,
      metadata: {
        confidence: pattern.confidence,
        count: pattern.count,
        reasoning: pattern.reasoning
      }
    };
  }

  // Detect what type of pattern this likely is
  detectPatternType(pattern) {
    const word = pattern.word.toLowerCase();
    const contexts = pattern.contexts.join(' ').toLowerCase();
    
    // Material detection
    if (this.isMaterial(word)) return 'material';
    
    // Color detection
    if (this.isColor(word)) return 'color';
    
    // Size detection
    if (this.isSize(word)) return 'size';
    
    // Product type detection
    if (this.isProductType(word, contexts)) return 'product';
    
    // Feature/attribute detection
    if (this.isFeature(word, contexts)) return 'feature';
    
    // Brand/collection detection
    if (this.isBrandTerm(word, pattern)) return 'brand';
    
    // Style descriptor
    if (this.isStyleDescriptor(word)) return 'style';
    
    // Default
    return 'general';
  }

  // Create the main classification question
  createClassificationQuestion(pattern, patternType) {
    const suggestions = this.getClassificationSuggestions(patternType);
    const customOptions = this.getLearnedCustomOptions(patternType);
    
    return {
      id: `${pattern.id}_classification`,
      type: 'classification',
      question: `"${pattern.word}" appears in ${pattern.count} products. How should I classify this?`,
      required: true,
      options: [
        ...suggestions.map(s => ({
          value: s.type,
          label: s.type,
          confidence: s.confidence,
          suggested: true
        })),
        ...customOptions.map(c => ({
          value: c,
          label: c,
          confidence: 0.8,
          suggested: false,
          learned: true
        })),
        {
          value: 'custom',
          label: 'Custom classification',
          isCustomInput: true,
          placeholder: 'e.g. "material, outdoor", "category, outerwear"'
        }
      ]
    };
  }

  // Create type-specific questions
  createTypeSpecificQuestions(pattern, patternType) {
    const questions = [];
    
    switch (patternType) {
      case 'material':
        questions.push(...this.createMaterialQuestions(pattern));
        break;
      case 'color':
        questions.push(...this.createColorQuestions(pattern));
        break;
      case 'product':
        questions.push(...this.createProductQuestions(pattern));
        break;
      case 'feature':
        questions.push(...this.createFeatureQuestions(pattern));
        break;
      case 'brand':
        questions.push(...this.createBrandQuestions(pattern));
        break;
      case 'size':
        questions.push(...this.createSizeQuestions(pattern));
        break;
      case 'style':
        questions.push(...this.createStyleQuestions(pattern));
        break;
      default:
        questions.push(...this.createGeneralQuestions(pattern));
    }
    
    return questions;
  }

  // Material-specific questions
  createMaterialQuestions(pattern) {
    return [
      {
        id: `${pattern.id}_material_hierarchy`,
        type: 'multiple_choice',
        question: `Should "${pattern.word}" be grouped with other materials?`,
        options: [
          { value: 'fabric', label: 'Fabric materials (cotton, wool, silk)' },
          { value: 'leather', label: 'Leather materials (leather, suede, hide)' },
          { value: 'synthetic', label: 'Synthetic materials (nylon, polyester)' },
          { value: 'natural', label: 'Natural materials (cotton, wool, leather)' },
          { value: 'standalone', label: 'Keep as standalone material' },
          { value: 'custom_group', label: 'Custom grouping', isCustomInput: true }
        ]
      },
      {
        id: `${pattern.id}_material_properties`,
        type: 'checkbox_multiple',
        question: `What properties should I associate with "${pattern.word}"?`,
        options: [
          { value: 'waterproof', label: 'Waterproof/water-resistant' },
          { value: 'breathable', label: 'Breathable' },
          { value: 'durable', label: 'Durable/heavy-duty' },
          { value: 'luxury', label: 'Premium/luxury' },
          { value: 'casual', label: 'Casual/everyday' },
          { value: 'outdoor', label: 'Outdoor/technical' }
        ]
      }
    ];
  }

  // Product-specific questions
  createProductQuestions(pattern) {
    return [
      {
        id: `${pattern.id}_product_hierarchy`,
        type: 'multiple_choice',
        question: `Where should "${pattern.word}" fit in the product hierarchy?`,
        options: [
          { value: 'main_category', label: 'Main category (top-level navigation)' },
          { value: 'subcategory', label: 'Subcategory (under another product type)' },
          { value: 'variant', label: 'Product variant (style of another product)' },
          { value: 'standalone', label: 'Standalone product type' }
        ]
      },
      {
        id: `${pattern.id}_product_parent`,
        type: 'conditional_text',
        question: `What should "${pattern.word}" be a subcategory of?`,
        condition: 'product_hierarchy === subcategory',
        placeholder: 'e.g. "outerwear", "bags", "footwear"'
      },
      {
        id: `${pattern.id}_product_gender`,
        type: 'checkbox_multiple',
        question: `What gender categories apply to "${pattern.word}"?`,
        options: [
          { value: 'mens', label: "Men's" },
          { value: 'womens', label: "Women's" },
          { value: 'unisex', label: 'Unisex' },
          { value: 'kids', label: 'Kids/Children' }
        ]
      }
    ];
  }

  // Color-specific questions
  createColorQuestions(pattern) {
    return [
      {
        id: `${pattern.id}_color_family`,
        type: 'multiple_choice',
        question: `What color family does "${pattern.word}" belong to?`,
        options: [
          { value: 'neutral', label: 'Neutral (black, white, gray, brown)' },
          { value: 'earth', label: 'Earth tones (tan, olive, khaki)' },
          { value: 'bright', label: 'Bright colors (red, blue, green)' },
          { value: 'dark', label: 'Dark colors (navy, charcoal, forest)' },
          { value: 'metallic', label: 'Metallic (gold, silver, bronze)' },
          { value: 'custom_family', label: 'Custom family', isCustomInput: true }
        ]
      },
      {
        id: `${pattern.id}_color_variants`,
        type: 'text',
        question: `What variations of "${pattern.word}" should I look for?`,
        placeholder: 'e.g. "dark brown, light brown, chocolate brown"'
      }
    ];
  }

  // Feature-specific questions
  createFeatureQuestions(pattern) {
    return [
      {
        id: `${pattern.id}_feature_type`,
        type: 'multiple_choice',
        question: `What type of feature is "${pattern.word}"?`,
        options: [
          { value: 'technical', label: 'Technical feature (waterproof, breathable)' },
          { value: 'construction', label: 'Construction feature (lined, insulated)' },
          { value: 'style', label: 'Style feature (vintage, classic)' },
          { value: 'fit', label: 'Fit feature (slim, regular, loose)' },
          { value: 'care', label: 'Care feature (machine washable, dry clean)' },
          { value: 'custom_type', label: 'Custom type', isCustomInput: true }
        ]
      },
      {
        id: `${pattern.id}_feature_products`,
        type: 'checkbox_multiple',
        question: `Which product types commonly have the "${pattern.word}" feature?`,
        options: [
          { value: 'outerwear', label: 'Outerwear (jackets, coats)' },
          { value: 'bags', label: 'Bags and accessories' },
          { value: 'footwear', label: 'Footwear' },
          { value: 'clothing', label: 'General clothing' },
          { value: 'all_products', label: 'All product types' }
        ]
      }
    ];
  }

  // Create combination suggestion question
  createCombinationQuestion(pattern, combinations) {
    return {
      id: `${pattern.id}_combinations`,
      type: 'checkbox_multiple',
      question: `I found these combinations with "${pattern.word}". Which should I track as separate patterns?`,
      options: combinations.map(combo => ({
        value: combo.combination,
        label: `${combo.combination} (found ${combo.count}x)`,
        metadata: { count: combo.count, confidence: combo.confidence }
      })).concat([
        { value: 'all_combinations', label: 'Track all combinations automatically' },
        { value: 'no_combinations', label: 'Don\'t track combinations for this pattern' }
      ])
    };
  }

  // Create expansion strategy question
  createExpansionQuestion(pattern, patternType) {
    return {
      id: `${pattern.id}_expansion`,
      type: 'checkbox_multiple',
      question: `How should I expand the search for "${pattern.word}"?`,
      options: [
        { value: 'synonyms', label: 'Find synonyms and alternative terms' },
        { value: 'variations', label: 'Find spelling variations and plurals' },
        { value: 'related', label: 'Find related terms in the same category' },
        { value: 'technical', label: 'Find technical specifications' },
        { value: 'descriptive', label: 'Find descriptive modifiers (premium, vintage, etc.)' },
        { value: 'stop_expansion', label: 'Don\'t expand - use exact term only' }
      ]
    };
  }

  // Create learning-based questions when patterns emerge
  createLearningQuestion(pattern) {
    const similarClassifications = this.findSimilarClassifications(pattern.word);
    
    if (similarClassifications.length === 0) return null;
    
    return {
      id: `${pattern.id}_learning`,
      type: 'confirmation',
      question: `I notice you previously classified similar terms as "${similarClassifications[0].classification}". Should I apply the same to "${pattern.word}"?`,
      options: [
        { value: 'yes', label: `Yes, classify as "${similarClassifications[0].classification}"` },
        { value: 'no', label: 'No, let me specify differently' },
        { value: 'similar', label: 'Similar but needs modification', isCustomInput: true }
      ],
      metadata: {
        learned: true,
        similarity: similarClassifications
      }
    };
  }

  // Process user responses and learn from them
  processLayer2Response(patternId, responses) {
    const result = {
      patternId,
      classification: null,
      hierarchy: null,
      properties: [],
      expansionStrategy: [],
      combinations: [],
      customDefinitions: []
    };
    
    // Process each response
    for (const [questionId, response] of Object.entries(responses)) {
      if (questionId.includes('classification')) {
        result.classification = this.processClassificationResponse(response);
      } else if (questionId.includes('hierarchy')) {
        result.hierarchy = response;
      } else if (questionId.includes('properties')) {
        result.properties = Array.isArray(response) ? response : [response];
      } else if (questionId.includes('expansion')) {
        result.expansionStrategy = Array.isArray(response) ? response : [response];
      } else if (questionId.includes('combinations')) {
        result.combinations = Array.isArray(response) ? response : [response];
      }
      
      // Handle custom inputs
      if (response && typeof response === 'object' && response.isCustom) {
        result.customDefinitions.push({
          question: questionId,
          value: response.value
        });
        
        // Learn from custom classification
        this.learnCustomClassification(response.value);
      }
    }
    
    return result;
  }

  // Process classification response and learn patterns
  processClassificationResponse(response) {
    if (typeof response === 'string') {
      return { type: response, custom: false };
    }
    
    if (response && response.isCustom) {
      // Parse custom classification like "material, outdoor"
      const parts = response.value.split(',').map(p => p.trim());
      const classification = {
        type: parts[0],
        subtype: parts[1] || null,
        custom: true,
        original: response.value
      };
      
      this.learnCustomClassification(response.value);
      return classification;
    }
    
    return { type: response, custom: false };
  }

  // Learn from custom classifications to improve future suggestions
  learnCustomClassification(classification) {
    const key = classification.toLowerCase();
    
    if (!this.customClassifications.has(key)) {
      this.customClassifications.set(key, {
        count: 1,
        firstSeen: new Date().toISOString(),
        examples: []
      });
    } else {
      const existing = this.customClassifications.get(key);
      existing.count++;
    }
    
    // Pattern recognition for custom classifications
    this.recognizeClassificationPatterns(classification);
  }

  // Recognize patterns in user's custom classifications
  recognizeClassificationPatterns(classification) {
    const parts = classification.split(',').map(p => p.trim());
    
    // Track primary classification patterns
    const primaryType = parts[0];
    if (!this.classificationPatterns.has(primaryType)) {
      this.classificationPatterns.set(primaryType, new Set());
    }
    
    // Track secondary patterns
    if (parts[1]) {
      this.classificationPatterns.get(primaryType).add(parts[1]);
    }
  }

  // Helper methods for pattern type detection
  isMaterial(word) {
    const materials = ['leather', 'canvas', 'wool', 'cotton', 'denim', 'silk', 'polyester', 'nylon', 'fleece', 'cashmere', 'linen', 'twill', 'corduroy', 'suede'];
    return materials.includes(word) || word.includes('fabric') || word.includes('material');
  }

  isColor(word) {
    const colors = ['black', 'white', 'brown', 'navy', 'gray', 'grey', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'tan', 'khaki', 'olive', 'burgundy', 'charcoal'];
    return colors.includes(word) || word.includes('color') || word.includes('colour');
  }

  isSize(word) {
    const sizes = ['xs', 'small', 'medium', 'large', 'xl', 'xxl', 'xxxl', 'petite', 'tall', 'plus'];
    return sizes.includes(word) || /^\d+(\.\d+)?(in|inch|cm|mm)$/.test(word);
  }

  isProductType(word, contexts) {
    const products = ['jacket', 'coat', 'shirt', 'pants', 'jeans', 'shorts', 'dress', 'skirt', 'bag', 'backpack', 'tote', 'wallet', 'belt', 'hat', 'cap', 'boot', 'shoe', 'sneaker'];
    return products.includes(word) || contexts.includes('product') || contexts.includes('item');
  }

  isFeature(word, contexts) {
    const features = ['waterproof', 'breathable', 'insulated', 'lined', 'vintage', 'classic', 'modern', 'slim', 'regular', 'loose', 'fitted'];
    return features.includes(word) || word.endsWith('proof') || word.endsWith('able') || word.includes('resist');
  }

  isBrandTerm(word, pattern) {
    // Detect if this might be a brand or collection name
    return pattern.uniqueProducts > 5 && 
           pattern.fields && pattern.fields.includes('title') && 
           pattern.variations && pattern.variations.length > 0 && 
           /^[A-Z]/.test(pattern.variations[0]);
  }

  isStyleDescriptor(word) {
    const styles = ['vintage', 'classic', 'modern', 'casual', 'formal', 'sporty', 'outdoor', 'urban', 'rustic', 'minimalist'];
    return styles.includes(word);
  }

  // Get classification suggestions based on pattern type
  getClassificationSuggestions(patternType) {
    const suggestions = {
      material: [
        { type: 'Material', confidence: 0.9 },
        { type: 'Attribute', confidence: 0.6 }
      ],
      color: [
        { type: 'Color', confidence: 0.9 },
        { type: 'Variant', confidence: 0.7 }
      ],
      product: [
        { type: 'Category', confidence: 0.8 },
        { type: 'Subcategory', confidence: 0.8 },
        { type: 'Product Type', confidence: 0.7 }
      ],
      feature: [
        { type: 'Feature', confidence: 0.8 },
        { type: 'Attribute', confidence: 0.7 }
      ],
      size: [
        { type: 'Size', confidence: 0.9 },
        { type: 'Variant', confidence: 0.6 }
      ],
      brand: [
        { type: 'Brand', confidence: 0.8 },
        { type: 'Collection', confidence: 0.7 }
      ],
      style: [
        { type: 'Style', confidence: 0.8 },
        { type: 'Attribute', confidence: 0.6 }
      ],
      general: [
        { type: 'Attribute', confidence: 0.5 },
        { type: 'Feature', confidence: 0.4 }
      ]
    };
    
    return suggestions[patternType] || suggestions.general;
  }

  // General questions for unclassified patterns
  createGeneralQuestions(pattern) {
    return [
      {
        id: `${pattern.id}_general_context`,
        type: 'multiple_choice',
        question: `How does "${pattern.word}" relate to your products?`,
        options: [
          { value: 'describes_product', label: 'Describes the product itself' },
          { value: 'describes_style', label: 'Describes the style/aesthetic' },
          { value: 'describes_use', label: 'Describes how it\'s used' },
          { value: 'marketing_term', label: 'Marketing/promotional term' },
          { value: 'technical_spec', label: 'Technical specification' }
        ],
        required: true
      },
      {
        id: `${pattern.id}_general_grouping`,
        type: 'text',
        question: `Should "${pattern.word}" be grouped with similar terms? If so, what would you call this group?`,
        placeholder: 'e.g., "Product Features", "Style Descriptors", "Usage Context"',
        required: false
      }
    ];
  }

  // Get learned custom options for similar patterns
  getLearnedCustomOptions(patternType) {
    const options = [];
    
    for (const [classification, data] of this.customClassifications) {
      if (data.count >= 2) { // Only suggest classifications used multiple times
        options.push(classification);
      }
    }
    
    return options.slice(0, 3); // Limit to top 3
  }

  // Find similar classifications the user has made
  findSimilarClassifications(word) {
    const similar = [];
    
    for (const [classification, data] of this.customClassifications) {
      // Simple similarity check - can be enhanced
      if (data.count >= 2) {
        similar.push({
          classification,
          count: data.count,
          similarity: 0.8 // Placeholder similarity score
        });
      }
    }
    
    return similar.sort((a, b) => b.count - a.count).slice(0, 3);
  }

  // Export learned patterns for persistence
  exportLearning() {
    return {
      customClassifications: Object.fromEntries(this.customClassifications),
      classificationPatterns: Object.fromEntries(
        Array.from(this.classificationPatterns.entries()).map(([k, v]) => [k, Array.from(v)])
      ),
      timestamp: new Date().toISOString()
    };
  }

  // Import previously learned patterns
  importLearning(data) {
    if (data.customClassifications) {
      this.customClassifications = new Map(Object.entries(data.customClassifications));
    }
    
    if (data.classificationPatterns) {
      this.classificationPatterns = new Map(
        Object.entries(data.classificationPatterns).map(([k, v]) => [k, new Set(v)])
      );
    }
  }
}

// Export for use in the survey system
export default Layer2QuestionGenerator;