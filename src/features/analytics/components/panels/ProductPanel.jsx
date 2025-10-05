import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import Overview from "../filters/product/Overview.jsx";
import Styles from "../filters/product/Styles.jsx";
import SearchBar from "../../../../components/SearchBar.jsx";
// Future sections
// import Categories from "../filters/product/Categories.jsx";
// import Attributes from "../filters/product/Attributes.jsx";

// ProductPanel: container that switches between product sub-panels with animation.
// Receives panelCommand from toolbar ProductControls and relays to active subpanel.
export default function ProductPanel({ panelCommand, onPanelStateChange, resetNonce, query, draft, onEdit, onCommand, suggestions = [], loading = false, error = null }) {
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (!panelCommand || !panelCommand.type) return;
    if (panelCommand.type === 'showSection') {
      setActiveSection(panelCommand.section || 'search');
    } else if (panelCommand.type === 'toggleSection') {
      setActiveSection((prev) => (prev === panelCommand.section ? null : (panelCommand.section || 'search')));
    }
  }, [panelCommand]);

  // Forward state upward so the toolbar can reflect info (counts, etc.)
  const handleChildState = (state) => {
    onPanelStateChange?.({ activeSection, ...state });
  };

  // Announce section changes so toolbar can sync its active state
  useEffect(() => {
    onPanelStateChange?.({ activeSection });
  }, [activeSection]);

  return (
    <div className="w-full">
      {/* Shared search header (hidden on Overview) */}
      {activeSection !== 'overview' && (
        <div className="bg-white p-2 border-b border-gray-100">
          <SearchBar
            value={draft?.text || ''}
            onChange={(v) => onCommand?.({ type: 'searchText', value: v })}
            onSubmit={(v) => onCommand?.({ type: 'searchText', value: v })}
            onClear={() => onCommand?.({ type: 'searchText', value: '' })}
            suggestions={suggestions}
            onSelectSuggestion={(item) => onPanelStateChange?.({ addCandidate: { sku: item?.sku, product_id: item?.product_id, title: item?.title } })}
            loading={loading}
            error={error}
            placeholder={activeSection === 'styles' ? 'Search styles…' : activeSection === 'category' ? 'Search categories…' : activeSection === 'variants' ? 'Search colors or sizes…' : 'Search products…'}
          />
        </div>
      )}
      <AnimatePresence mode="wait" initial={false}>
        {activeSection === 'overview' && (
          <motion.div
            key="panel-overview"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ height: { duration: 0.2, ease: 'easeInOut' }, opacity: { duration: 0.15 } }}
            style={{ overflow: 'hidden' }}
          >
            <Overview draft={draft} onEdit={(section) => onEdit?.(section)} />
          </motion.div>
        )}

        {activeSection === 'styles' && (
          <motion.div
            key="panel-styles"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ height: { duration: 0.2, ease: 'easeInOut' }, opacity: { duration: 0.15 } }}
            style={{ overflow: 'hidden' }}
          >
            <Styles 
              onPanelStateChange={handleChildState}
              selected={(draft?.selectedProducts) || []}
              onRemove={(key) => onPanelStateChange?.({ removeCandidate: key })}
            />
          </motion.div>
        )}

        {/* Future sections scaffold (kept hidden until implemented)
        {activeSection === 'category' && (
          <motion.div key="panel-category" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} transition={{height:{duration:0.2}, opacity:{duration:0.15}}} style={{overflow:'hidden'}}>
            <Categories onPanelStateChange={handleChildState} panelCommand={panelCommand} />
          </motion.div>
        )}
        {activeSection === 'attributes' && (
          <motion.div key="panel-attributes" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} transition={{height:{duration:0.2}, opacity:{duration:0.15}}} style={{overflow:'hidden'}}>
            <Attributes onPanelStateChange={handleChildState} panelCommand={panelCommand} />
          </motion.div>
        )}
        */}
      </AnimatePresence>
    </div>
  );
}
