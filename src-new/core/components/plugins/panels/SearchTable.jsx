import React from 'react';
import { useDragDrop } from '../../../hooks/useDragDrop.js';
import { DRAG_TYPES } from '../../../utils/dragDropTypes.js';

/**
 * SearchTable - Simple A2-section table for product search results
 * Each product name is draggable
 */
export default function SearchTable({
  candidates = [],
  // Layout props
  rowHeight = 30,
  containerClassName = "h-[90px] shadow-lg rounded-lg overflow-y-auto bg-white",
  rowClassName = "flex items-center px-3 hover:bg-gray-50 cursor-grab active:cursor-grabbing",
  // Style props
  productNameClassName = "text-xs text-gray-900 truncate",
  countClassName = "text-xs text-gray-500 ml-2",
  dividerClassName = "divide-y divide-gray-200"
}) {
  const { handleDragStart } = useDragDrop();

  const handleProductDragStart = (e, product) => {
    e.dataTransfer.effectAllowed = 'copy';

    const serialized = handleDragStart(DRAG_TYPES.PRODUCT, {
      title: product.title,
      content: product.items || [],
      options: {}
    });

    e.dataTransfer.setData('text/plain', serialized);
  };

  return (
    <div className={containerClassName}>
      <div className={dividerClassName}>
        {candidates.map((product, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={(e) => handleProductDragStart(e, product)}
            className={rowClassName}
            style={{ height: `${rowHeight}px` }}
          >
            <div className="flex-1">
              <div className={productNameClassName}>
                {product.title}
              </div>
            </div>
            <div className={countClassName}>
              {product.count} units
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
