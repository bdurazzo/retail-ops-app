import React, { useState } from 'react';

const AssistantDashboard = () => {
  const [activeTool, setActiveTool] = useState('dashboard');

  const aiTools = [
    {
      id: 'pattern-discovery',
      title: '🧠 Product Pattern Discovery',
      description: 'AI-powered analysis to discover product categories, attributes, and filtering patterns from your catalog',
      status: 'ready',
      complexity: 'advanced',
      estimatedTime: '15-30 minutes',
      features: [
        'Analyzes 38K+ products automatically',
        'Trainable survey system that learns your preferences',
        'Generates dynamic product filter taxonomies',
        'Exports classification results for implementation'
      ]
    },
    {
      id: 'pricing-intelligence',
      title: '📊 Pricing Intelligence',
      description: 'Analyze pricing patterns, identify anomalies, and optimize price positioning across your product catalog',
      status: 'coming-soon',
      complexity: 'intermediate',
      estimatedTime: '10-15 minutes',
      features: [
        'Price cluster analysis and optimization',
        'Competitive pricing gap identification',
        'Seasonal pricing pattern detection',
        'Revenue impact predictions'
      ]
    },
    {
      id: 'sales-patterns',
      title: '📈 Sales Pattern Analysis',
      description: 'Discover hidden sales trends, seasonal patterns, and product performance insights from your order data',
      status: 'coming-soon',
      complexity: 'intermediate',
      estimatedTime: '10-20 minutes',
      features: [
        'Cross-reference catalog with order data',
        'Identify top and underperforming products',
        'Seasonal trend analysis',
        'Customer behavior pattern detection'
      ]
    },
    {
      id: 'customer-insights',
      title: '🎯 Customer Behavior Insights',
      description: 'AI analysis of customer purchase patterns, preferences, and segmentation opportunities',
      status: 'planned',
      complexity: 'advanced',
      estimatedTime: '20-30 minutes',
      features: [
        'Customer segmentation analysis',
        'Purchase pattern recognition',
        'Product affinity mapping',
        'Personalization recommendations'
      ]
    },
    {
      id: 'market-research',
      title: '🔍 Market Research Assistant',
      description: 'Competitive analysis, market positioning, and product gap identification using AI',
      status: 'planned',
      complexity: 'advanced',
      estimatedTime: '30+ minutes',
      features: [
        'Competitive product analysis',
        'Market gap identification',
        'Trend forecasting',
        'Strategic recommendations'
      ]
    },
    {
      id: 'inventory-optimization',
      title: '📦 Inventory Intelligence',
      description: 'AI-powered inventory analysis, demand forecasting, and stock optimization recommendations',
      status: 'planned',
      complexity: 'intermediate',
      estimatedTime: '15-25 minutes',
      features: [
        'Demand pattern analysis',
        'Stock level optimization',
        'Seasonal inventory planning',
        'Reorder point recommendations'
      ]
    }
  ];

  const getStatusBadge = (status) => {
    const badges = {
      'ready': { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Ready' },
      'coming-soon': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '🚧 Coming Soon' },
      'planned': { bg: 'bg-gray-100', text: 'text-gray-600', label: '📋 Planned' }
    };
    
    const badge = badges[status] || badges.planned;
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getComplexityBadge = (complexity) => {
    const badges = {
      'simple': { bg: 'bg-blue-100', text: 'text-blue-800', label: '🟢 Simple' },
      'intermediate': { bg: 'bg-purple-100', text: 'text-purple-800', label: '🟡 Intermediate' },
      'advanced': { bg: 'bg-red-100', text: 'text-red-800', label: '🔴 Advanced' }
    };
    
    const badge = badges[complexity] || badges.simple;
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  // Render specific tool interface
  if (activeTool === 'pattern-discovery') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header with back button */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTool('dashboard')}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 rounded"
                >
                  ← Back to Dashboard
                </button>
                <div className="h-4 border-l border-gray-300"></div>
                <h1 className="text-xl font-bold">🧠 Product Pattern Discovery</h1>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tool content */}
        <div className="max-w-7xl mx-auto">
          <SurveyUI />
        </div>
      </div>
    );
  }

  // Render main dashboard
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">🤖 AI Assistant Dashboard</h1>
        <p className="text-gray-600 text-lg">
          Powerful AI-powered tools to analyze your retail data, discover insights, and optimize your business operations.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-800">Available Tools</h3>
          <p className="text-2xl font-bold text-blue-600">
            {aiTools.filter(tool => tool.status === 'ready').length}
          </p>
          <p className="text-sm text-gray-500">Ready to use</p>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-800">In Development</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {aiTools.filter(tool => tool.status === 'coming-soon').length}
          </p>
          <p className="text-sm text-gray-500">Coming soon</p>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-800">Planned Features</h3>
          <p className="text-2xl font-bold text-gray-600">
            {aiTools.filter(tool => tool.status === 'planned').length}
          </p>
          <p className="text-sm text-gray-500">In planning</p>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-800">Total Tools</h3>
          <p className="text-2xl font-bold text-purple-600">{aiTools.length}</p>
          <p className="text-sm text-gray-500">AI-powered tools</p>
        </div>
      </div>

      {/* Featured Tool */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🧠</span>
              <h2 className="text-2xl font-bold">Featured: Product Pattern Discovery</h2>
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
                ✨ Ready Now
              </span>
            </div>
            <p className="text-lg mb-4 opacity-90">
              Our most advanced AI tool analyzes your entire product catalog to discover natural categories, 
              attributes, and filtering patterns. Train the AI with your feedback to build the perfect taxonomy for your business.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-sm">38K+ Products</span>
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-sm">Trainable AI</span>
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-sm">Dynamic Surveys</span>
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-sm">Export Ready</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTool('pattern-discovery')}
            className="ml-6 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-medium whitespace-nowrap"
          >
            Launch Tool →
          </button>
        </div>
      </div>

      {/* All AI Tools Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">All AI Tools</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {aiTools.map((tool) => (
            <div key={tool.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{tool.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    {getStatusBadge(tool.status)}
                    {getComplexityBadge(tool.complexity)}
                    <span className="text-xs text-gray-500">⏱️ {tool.estimatedTime}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">{tool.description}</p>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">Key Features:</h4>
                <ul className="space-y-1">
                  {tool.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      {feature}
                    </li>
                  ))}
                  {tool.features.length > 3 && (
                    <li className="text-xs text-gray-500">
                      +{tool.features.length - 3} more features...
                    </li>
                  )}
                </ul>
              </div>
              
              <div className="flex gap-2">
                {tool.status === 'ready' ? (
                  <button
                    onClick={() => setActiveTool(tool.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                  >
                    Launch Tool
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-500 rounded cursor-not-allowed font-medium"
                  >
                    {tool.status === 'coming-soon' ? 'Coming Soon' : 'In Planning'}
                  </button>
                )}
                
                <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">🚀 Getting Started</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded p-4">
            <div className="text-2xl mb-2">1️⃣</div>
            <h3 className="font-semibold mb-2">Start with Pattern Discovery</h3>
            <p className="text-sm text-gray-600">
              Begin by analyzing your product catalog to understand the natural patterns and categories in your data.
            </p>
          </div>
          
          <div className="bg-white rounded p-4">
            <div className="text-2xl mb-2">2️⃣</div>
            <h3 className="font-semibold mb-2">Train the AI</h3>
            <p className="text-sm text-gray-600">
              Use the interactive survey system to teach the AI what classifications matter for your business.
            </p>
          </div>
          
          <div className="bg-white rounded p-4">
            <div className="text-2xl mb-2">3️⃣</div>
            <h3 className="font-semibold mb-2">Export & Implement</h3>
            <p className="text-sm text-gray-600">
              Export your trained classifications and use them to build dynamic product filtering systems.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantDashboard;