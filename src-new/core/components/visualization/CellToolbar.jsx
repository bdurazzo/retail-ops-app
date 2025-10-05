import React from 'react';
import Toolbar from '../../../components/Toolbar.jsx';
import { IconChevronDown, IconChevronRight, IconChevronUp } from '@tabler/icons-react';

// CellToolbar: Reusable component for creating coordinated toolbar rows across table columns
// Flexible configuration for any table structure, data mapping, and interaction patterns
export default function CellToolbar({
  // Column configuration - which columns to render and how
  columns = [],                    // Array of column keys ['Date', 'Orders', 'Revenue']
  
  // Cell content configuration - flexible data mapping
  cellContent = {},               // Object mapping column keys to content: { 'Date': 'Aug 27', 'Orders': '5 orders' }
  cellRenderers = {},             // Custom render functions per column: { 'Date': (value) => <custom jsx> }
  formatters = {},                // Format functions per column: { 'Revenue': (value) => `$${value}` }
  fallbackValue = '?',            // What to show when data is missing
  
  // Interaction configuration
  expandable = false,             // Whether this row can expand/collapse
  isExpanded = false,             // Current expansion state
  onToggle = null,                // Expand/collapse handler
  chevronColumn = 0,              // Which column gets the chevron (by index)
  chevronType = 'expand',         // 'expand' | 'collapse' | 'none'
  chevronSize = 16,               // Chevron icon size
  
  // Toolbar styling - flexible props passed to underlying Toolbar components
  height = 8,                     // Toolbar height
  borderWidth = 0,                // Toolbar border width
  shadowSize = 'none',            // Toolbar shadow
  paddingX = 2,                   // Toolbar padding
  centerPaddingX = 2,             // Center content padding
  rounded = '',                   // Border radius
  backgroundColor = 'bg-white',   // Background color
  hoverColor = 'hover:bg-gray-50', // Hover color
  textColor = 'text-gray-900',    // Text color
  textSize = 'text-[13px]',       // Text size
  fontWeight = 'font-medium',     // Font weight
  
  // Advanced configuration
  columnWidths = {},              // Custom widths per column
  alignments = {},                // Custom alignments per column
  customProps = {},               // Additional props per column for Toolbar
  
  ...otherProps
}) {
  
  // Generate chevron icon based on state and type
  const getChevronIcon = () => {
    if (!expandable || chevronType === 'none') return null;
    
    const iconProps = { size: chevronSize, stroke: 1.5 };
    
    if (chevronType === 'collapse') {
      return <IconChevronUp {...iconProps} />;
    }
    
    return isExpanded ? 
      <IconChevronDown {...iconProps} /> : 
      <IconChevronRight {...iconProps} />;
  };
  
  // Get content for a specific column
  const getCellContent = (columnKey) => {
    // Check for custom renderer first
    if (cellRenderers[columnKey]) {
      return cellRenderers[columnKey](cellContent[columnKey], cellContent);
    }
    
    // Check for formatter function
    if (formatters[columnKey] && cellContent[columnKey] != null) {
      return formatters[columnKey](cellContent[columnKey]);
    }
    
    // Return raw content or fallback
    return cellContent[columnKey] != null ? cellContent[columnKey] : fallbackValue;
  };
  
  // Create renderer function for a specific column
  const createColumnRenderer = (columnKey, columnIndex) => {
    return (cellValue, rowObject, rowIndex, actualColumnKey) => {
      const hasChevron = expandable && columnIndex === chevronColumn;
      const alignment = alignments[columnKey] || 'start';
      const customColumnProps = customProps[columnKey] || {};
      
      // Allow access to all Table.jsx renderer parameters for maximum flexibility
      const rendererContext = {
        cellValue,
        rowObject,
        rowIndex,
        actualColumnKey,
        columnKey,
        columnIndex
      };
      
      // Check for custom cell renderers that want full control
      if (cellRenderers[columnKey]) {
        const customResult = cellRenderers[columnKey](cellValue, rowObject, rowIndex, actualColumnKey, rendererContext);
        if (customResult !== undefined) return customResult;
      }
      
      // Chevron button for expandable columns
      const leftContent = hasChevron ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle && onToggle(cellValue, rowObject, rowIndex, actualColumnKey, rendererContext);
          }}
          className="flex items-center justify-center rounded hover:bg-gray-900 hover:text-white p-1"
          aria-label={chevronType === 'collapse' ? 'Collapse' : (isExpanded ? 'Collapse' : 'Expand')}
          disabled={!onToggle}
        >
          {getChevronIcon()}
        </button>
      ) : null;
      
      // Allow dynamic content based on row data
      let contentValue = getCellContent(columnKey);
      
      // If content uses placeholders like {field}, replace with row data
      if (typeof contentValue === 'string' && contentValue.includes('{') && rowObject) {
        contentValue = contentValue.replace(/\{([^}]+)\}/g, (match, fieldName) => {
          return rowObject[fieldName] || match;
        });
      }
      
      // Main cell content with dynamic classes
      const contentClasses = `${textSize} ${fontWeight} ${textColor} ${customColumnProps.textClasses || 'truncate'}`;
      const centerContent = (
        <div className={`flex items-center justify-${alignment} ${customColumnProps.containerClasses || ''}`}>
          <div className={contentClasses} title={typeof contentValue === 'string' ? contentValue : undefined}>
            {contentValue}
          </div>
          {customColumnProps.suffix && <span className="ml-1 text-xs text-gray-500">{customColumnProps.suffix}</span>}
        </div>
      );
      
      // Additional content for complex cells
      const rightContent = customColumnProps.rightContent || null;
      
      // Render as Toolbar component for interactive cells
      if (hasChevron || customColumnProps.forceToolbar || rightContent) {
        return (
          <Toolbar 
            leftContent={leftContent}
            centerContent={centerContent}
            centerJustify={alignment}
            rightContent={rightContent}
            height={customColumnProps.height || height}
            borderWidth={customColumnProps.borderWidth !== undefined ? customColumnProps.borderWidth : borderWidth}
            shadowSize={customColumnProps.shadowSize || shadowSize}
            paddingX={customColumnProps.paddingX !== undefined ? customColumnProps.paddingX : paddingX}
            centerPaddingX={hasChevron ? 1 : (customColumnProps.centerPaddingX !== undefined ? customColumnProps.centerPaddingX : centerPaddingX)}
            rounded={customColumnProps.rounded !== undefined ? customColumnProps.rounded : rounded}
            backgroundColor={customColumnProps.backgroundColor || backgroundColor}
            hoverColor={customColumnProps.hoverColor || hoverColor}
            {...customColumnProps.toolbarProps}
            {...(customColumnProps.inheritOtherProps ? otherProps : {})}
          />
        );
      }
      
      // For simple content cells, return just the content
      return centerContent;
    };
  };
  
  // Generate customCellRenderer object for Table.jsx
  const cellRenderer = {};
  columns.forEach((columnKey, index) => {
    cellRenderer[columnKey] = createColumnRenderer(columnKey, index);
  });
  
  return cellRenderer;
}

// Header renderer factory for CellToolbar
export function createHeaderRenderer({
  columns = [],
  headerContent = {},
  headerRenderers = {},
  showSortIndicators = true,
  onSort = null,
  ...headerProps
}) {
  const headerRenderer = {};
  
  columns.forEach((columnKey, index) => {
    headerRenderer[columnKey] = (actualColumnKey, displayLabel) => {
      // Custom header renderer takes precedence
      if (headerRenderers[columnKey]) {
        return headerRenderers[columnKey](actualColumnKey, displayLabel, index);
      }
      
      // Default header with optional sorting
      const content = headerContent[columnKey] || displayLabel;
      const sortable = onSort && showSortIndicators;
      
      return (
        <div className={`flex items-center ${sortable ? 'cursor-pointer hover:text-gray-900' : ''}`}
             onClick={sortable ? () => onSort(actualColumnKey) : undefined}>
          <span>{content}</span>
          {/* Sort indicator would be added by Table.jsx automatically */}
        </div>
      );
    };
  });
  
  return headerRenderer;
}

// Utility to merge multiple CellToolbar instances (for complex tables)
export function mergeCellToolbars(...toolbars) {
  const merged = {};
  toolbars.forEach(toolbar => {
    if (toolbar && typeof toolbar === 'object') {
      Object.assign(merged, toolbar);
    }
  });
  return merged;
}

// Factory for common table patterns
export const createTablePatterns = {
  // Expandable rows with summary data
  expandableRows: (rowsData, options = {}) => {
    return rowsData.map(rowData => CellToolbar({
      columns: options.columns || ['Name', 'Count', 'Value'],
      cellContent: rowData.summary,
      expandable: true,
      isExpanded: rowData.expanded,
      onToggle: () => options.onToggle && options.onToggle(rowData.id),
      formatters: options.formatters,
      ...options.toolbarProps
    }));
  },
  
  // Nested category structure
  categoryRows: (categories, options = {}) => {
    const renderers = {};
    categories.forEach(category => {
      Object.assign(renderers, CellToolbar({
        columns: options.columns || ['Category', 'Items', 'Total'],
        cellContent: category.data,
        expandable: true,
        isExpanded: category.expanded,
        onToggle: () => options.onToggle && options.onToggle(category.id),
        chevronType: category.isCollapsing ? 'collapse' : 'expand',
        ...options.toolbarProps
      }));
    });
    return renderers;
  },
  
  // Action rows with buttons
  actionRows: (actions, options = {}) => {
    return CellToolbar({
      columns: options.columns || ['Action', 'Status', 'Result'],
      cellContent: options.content || {},
      cellRenderers: {
        Action: () => options.actionButton || <button>Action</button>
      },
      customProps: {
        Action: { forceToolbar: true, rightContent: options.rightButtons }
      },
      ...options.toolbarProps
    });
  }
};

// Helper function to create common formatters
export const createFormatters = {
  currency: (decimals = 2) => (value) => {
    try {
      const num = typeof value === 'string' ? parseFloat(value.replace(/[$,]/g, '')) : Number(value);
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    } catch {
      return value;
    }
  },
  
  date: (format = { month: 'short', day: 'numeric' }) => (value) => {
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-US', format);
    } catch {
      return value;
    }
  },
  
  number: (decimals = 0) => (value) => {
    try {
      const num = Number(value);
      return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    } catch {
      return value;
    }
  },
  
  percentage: (decimals = 1) => (value) => {
    try {
      const num = Number(value);
      return `${num.toFixed(decimals)}%`;
    } catch {
      return value;
    }
  }
};