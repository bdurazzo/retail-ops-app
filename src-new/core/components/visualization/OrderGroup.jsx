import React, { useState } from 'react';
import Table from '../../../components/Table.jsx';
import Toolbar from '../../../components/Toolbar.jsx';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

// OrderGroup: Simple table component that matches the existing UI
export default function OrderGroup({ 
  table, 
  placeholderRows, 
  placeholderCols,
  // Pass through all the styling props that make tables look consistent
  headerClasses,
  footerClasses,
  a1Classes,
  a2Classes, 
  a3Classes,
  b1Classes,
  b2Classes,
  b3Classes,
  // Toolbar customization props
  dayToolbarClasses = "",
  orderToolbarClasses = "",
  orderToolbarTextClasses = "text-[11px] font-medium text-gray-700",
  orderExpandedToolbarClasses = "h-[38px] mx-auto bg-gradient-to-l from-gray-300 via-gray-200 to-gray-300 border-b",
  orderExpandedToolbarTextClasses = "text-[11px] font-medium text-gray-600",
  // Order B column styling (for Orders, Items, Revenue columns)
  orderBColumnClasses = "",
  orderBColumnTextClasses = "text-[11px] text-gray-700",
  orderExpandedBColumnClasses = "h-[39px] mx-auto bg-gradient-to-l from-gray-300 via-gray-200 to-gray-300 border-b border-300",
  orderExpandedBColumnTextClasses = "text-[11px] text-gray-700 font-medium",
  toolbarHeight = "",
  toolbarWidth = "",
  toolbarShadowSize = "",
  toolbarBackgroundColor = "bg-gradient-to-r from-gray-50 via-white to-gray-100",
  // Line item header styling props - A2 column (left side)
  lineItemHeaderA2Classes = "shadow-xl border-b border-t border-gray-300 bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100 shadow-xl",
  lineItemHeaderA2TextClasses = "text-[12px] px-2 font-semibold text-gray-600",
  // Line item data styling props - A2 column (data rows, not headers)
  lineItemDataA2Classes = "flex items-center bg-white border-b border-l shadow-xl border-gray-300",
  lineItemDataA2TextClasses = "text-[10px] text-gray-600",
  // Line item header styling props - B2 columns (right side) 
  lineItemHeaderB2Classes = "border-t border-b border-gray-300 bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100",
  lineItemHeaderB2TextClasses = "text-[12px] mx-auto font-semibold text-gray-700",
  // Line item data styling props - B2 columns (data rows, not headers)
  lineItemDataB2Classes = "h-full bg-white border-b justify-center border-gray-300",
  lineItemDataB2TextClasses = "text-[11px] text-gray-600",
  ...otherProps 
}) {
  // Manage expansion state for single day
  const [dayExpanded, setDayExpanded] = useState(false);
  // Manage expansion state for individual orders
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  // Manage hover states
  const [dayHover, setDayHover] = useState(false);
  const [orderHovers, setOrderHovers] = useState(new Set());

  // Sample data for single day
  const sampleDayData = {
    key: 'day1',
    date: '03-15-2024',
    label: '03/15/2024',
    orderCount: 3,
    itemCount: 12,
    revenue: '$456.78',
    orders: [
      { 
        id: '#12345', 
        time: '10:30 AM', 
        items: 4, 
        revenue: '$152.26',
        lineItems: [
          { sku: 'ABC-001', name: 'Blue T-Shirt - Size M', qty: 2, price: '$25.00', total: '$50.00' },
          { sku: 'DEF-002', name: 'Jeans - Size 32', qty: 1, price: '$75.00', total: '$75.00' },
          { sku: 'GHI-003', name: 'Sneakers - Size 10', qty: 1, price: '$27.26', total: '$27.26' }
        ]
      },
      { 
        id: '#12346', 
        time: '11:15 AM', 
        items: 2, 
        revenue: '$89.50',
        lineItems: [
          { sku: 'JKL-004', name: 'Red Hoodie - Size L', qty: 1, price: '$45.00', total: '$45.00' },
          { sku: 'MNO-005', name: 'Baseball Cap', qty: 1, price: '$44.50', total: '$44.50' }
        ]
      },
      { 
        id: '#12347', 
        time: '2:45 PM', 
        items: 6, 
        revenue: '$215.02',
        lineItems: [
          { sku: 'PQR-006', name: 'Winter Jacket - Size M', qty: 1, price: '$125.00', total: '$125.00' },
          { sku: 'STU-007', name: 'Scarf - Blue', qty: 2, price: '$15.00', total: '$30.00' },
          { sku: 'VWX-008', name: 'Gloves - Size M', qty: 1, price: '$20.00', total: '$20.00' },
          { sku: 'YZA-009', name: 'Boots - Size 9', qty: 2, price: '$20.01', total: '$40.02' }
        ]
      }
    ]
  };

  // Toggle day expansion
  const toggleDay = () => {
    setDayExpanded(prev => !prev);
  };

  // Toggle order expansion
  const toggleOrder = (orderId) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Order hover management
  const setOrderHover = (orderId, isHovering) => {
    setOrderHovers(prev => {
      const next = new Set(prev);
      if (isHovering) {
        next.add(orderId);
      } else {
        next.delete(orderId);
      }
      return next;
    });
  };

  // Static header renderers - just column labels
  const customHeaderRenderer = {
    Date: () => <span className="pointer-events-none">Date</span>,
    Orders: () => <span className="pointer-events-none">Orders</span>,
    Items: () => <span className="pointer-events-none">Items</span>,
    Revenue: () => <span className="pointer-events-none">Amount</span>
  };


  // Build rows dynamically - day summary + expanded orders underneath
  const buildRows = () => {
    const rows = [];
    
    // Day summary row (interactive chevron in A2)
    rows.push({
      type: 'day',
      Date: sampleDayData.label, // Day 1 - March 15, 2024
      Orders: `${sampleDayData.orderCount}`,
      Items: `${sampleDayData.itemCount}`,
      Revenue: sampleDayData.revenue,
      dayKey: sampleDayData.key
    });
    
    // If expanded, add order rows underneath
    if (dayExpanded) {
      sampleDayData.orders.forEach(order => {
        // Add order summary row
        rows.push({
          type: 'order',
          orderId: order.id,
          Date: order.time,
          Orders: order.id,
          Items: order.items.toString(),
          Revenue: order.revenue
        });
        
        // If this order is expanded, add line item rows underneath
        if (expandedOrders.has(order.id)) {
          // First add a static header row for line items
          rows.push({
            type: 'lineItemHeader',
            Date: 'Product', // A2 column - Product header
            Orders: 'Size', // B1 column - Size header
            Items: 'Color', // B2 column - Color header  
            Revenue: 'Price' // B3 column - Price header
          });
          
          // Then add the actual line item data rows
          order.lineItems.forEach(lineItem => {
            rows.push({
              type: 'lineItem',
              Date: lineItem.name, // A2 column - Product name
              Orders: 'M', // B1 column - Size (placeholder)
              Items: 'Blue', // B2 column - Color (placeholder)
              Revenue: lineItem.total // B3 column - Price
            });
          });
        }
      });
    }
    
    return rows;
  };

  // Custom cell renderer - interactive chevron in A2 for day rows and order rows
  const customCellRenderer = {
    Date: (value, row) => {
      if (row.type === 'day') {
        // Day summary row - use Toolbar component like ProductGroup
        const leftContent = (
          <div className="absolute left-0">
            <button
              onClick={() => toggleDay()}
              onMouseEnter={() => setDayHover(true)}
              onMouseLeave={() => setDayHover(false)}
              className={`${dayHover ? 'bg-gray-900 text-white' : 'bg-gradient-to-t from-gray-200 via-gray-50 to-gray-100'} w-[30px] h-[35px] flex border items-center justify-center`}
              aria-label={`${dayExpanded ? 'Collapse' : 'Expand'} ${row.dayKey}`}
            >
              {dayExpanded ? (
                <IconChevronDown size={14} stroke={1.5} />
              ) : (
                <IconChevronRight size={14} stroke={1.5} />
              )}
            </button>
          </div>
          
        );

        const centerContent = (
          <div className="absolute right-2">
            <div className="text-[11px] font-medium text-gray-600">
              {value}
            </div>
          </div>
        );

        return (
          <div className="w-full h-full flex items-center justify-center">
          <Toolbar 
            leftContent={leftContent}
            centerContent={centerContent}
            centerJustify="center"
            rightContent={null}
            height="h-full"
            width="w-full"
            shadowSize={toolbarShadowSize}
            rounded=""
            backgroundColor={toolbarBackgroundColor}
            className={dayToolbarClasses}
          />
          </div>
        );
      }
      
      if (row.type === 'order') {
        // Order summary row - use Toolbar component with order expansion
        const isOrderExpanded = expandedOrders.has(row.orderId);
        const isOrderHovered = orderHovers.has(row.orderId);
        const leftContent = (
          <div className="absolute left-0">
            <button
              onClick={() => toggleOrder(row.orderId)}
              onMouseEnter={() => setOrderHover(row.orderId, true)}
              onMouseLeave={() => setOrderHover(row.orderId, false)}
              className={`${isOrderHovered ? 'bg-gray-900 text-white flex justify-center border' : 'bg-gradient-to-t from-gray-200 via-gray-50 to-gray-100 flex justify-center'} flex w-[30px] h-[35px] border items-center justify-center}`}
              aria-label={`${isOrderExpanded ? 'Collapse' : 'Expand'} ${row.orderId}`}
            >
              {isOrderExpanded ? (
                <IconChevronDown size={14} stroke={1.5} />
              ) : (
                <IconChevronRight size={14} stroke={1.5} />
              )}
            </button>
          </div>
        );

        const orderTextClasses = isOrderExpanded ? orderExpandedToolbarTextClasses : orderToolbarTextClasses;
        const centerContent = (
          <div className="absolute left-11">
            <div className={orderTextClasses}>
              {value}
            </div>
          </div>
        );

        return (
          <div className="w-full h-full flex items-center justify-center">
          <Toolbar 
            leftContent={leftContent}
            centerContent={centerContent}
            centerJustify=""
            rightContent={null}
            height="h-full"
            width="w-full"
            shadowSize={toolbarShadowSize}
            rounded=""
            backgroundColor={isOrderExpanded ? orderExpandedToolbarClasses : toolbarBackgroundColor}
            className={isOrderExpanded ? orderExpandedToolbarClasses : orderToolbarClasses}
          />
          </div>
        );
      }
      
      if (row.type === 'lineItemHeader') {
        // Line item header row - styled header for product details (A2 column)
        return (
          <div className={`flex items-center justify-center px-2 h-full ${lineItemHeaderA2Classes}`}>
            <div className={lineItemHeaderA2TextClasses}>
              {value}
            </div>
          </div>
        );
      }
      
      if (row.type === 'lineItem') {
        // Line item data row - styled data for product details (A2 column)
        return (
          <div className={`flex items-center justify-start px-2 h-full ${lineItemDataA2Classes}`}>
            <div className={lineItemDataA2TextClasses}>
              {value}
            </div>
          </div>
        );
      }
      
      // All other row types - return undefined to use default styling
      return undefined;
    },
    
    // B2 column renderers that handle line item headers AND line item data
    Orders: (value, row) => {
      if (row.type === 'lineItemHeader') {
        // Custom styling for line item headers (B2 columns)
        return (
          <div className={`flex items-center justify-start px-2 h-full ${lineItemHeaderB2Classes}`}>
            <div className={lineItemHeaderB2TextClasses}>
              {value}
            </div>
          </div>
        );
      }
      if (row.type === 'lineItem') {
        // Custom styling for line item data (B2 columns)
        return (
          <div className={`flex items-center justify-start px-2 h-full ${lineItemDataB2Classes}`}>
            <div className={lineItemDataB2TextClasses}>
              {value}
            </div>
          </div>
        );
      }
      if (row.type === 'order') {
        // Order row styling - conditional based on expansion
        const isOrderExpanded = expandedOrders.has(row.orderId);
        const orderClasses = isOrderExpanded ? orderExpandedBColumnClasses : orderBColumnClasses;
        const orderTextClasses = isOrderExpanded ? orderExpandedBColumnTextClasses : orderBColumnTextClasses;
        return (
          <div className={`flex items-center justify-center px-2 h-full ${orderClasses}`}>
            <div className={orderTextClasses}>
              {value}
            </div>
          </div>
        );
      }
      // For all other row types, return the value so Table.jsx renders it normally
      return value;
    },
    
    Items: (value, row) => {
      if (row.type === 'lineItemHeader') {
        // Custom styling for line item headers (B2 columns)
        return (
          <div className={`flex items-center justify-start px-2 h-full ${lineItemHeaderB2Classes}`}>
            <div className={lineItemHeaderB2TextClasses}>
              {value}
            </div>
          </div>
        );
      }
      if (row.type === 'lineItem') {
        // Custom styling for line item data (B2 columns)
        return (
          <div className={`flex items-center justify-start px-2 h-full ${lineItemDataB2Classes}`}>
            <div className={lineItemDataB2TextClasses}>
              {value}
            </div>
          </div>
        );
      }
      // For all other row types, return the value so Table.jsx renders it normally
      return value;
    },
    
    Revenue: (value, row) => {
      if (row.type === 'lineItemHeader') {
        // Custom styling for line item headers (B2 columns)
        return (
          <div className={`flex items-center justify-start px-2 h-full ${lineItemHeaderB2Classes}`}>
            <div className={lineItemHeaderB2TextClasses}>
              {value}
            </div>
          </div>
        );
      }
      if (row.type === 'lineItem') {
        // Custom styling for line item data (B2 columns)
        return (
          <div className={`flex items-center justify-start px-2 h-full ${lineItemDataB2Classes}`}>
            <div className={lineItemDataB2TextClasses}>
              {value}
            </div>
          </div>
        );
      }
      // For all other row types, return the value so Table.jsx renders it normally
      return value;
    },
    
    // Handle order row styling for Items and Revenue columns
    Items: (value, row) => {
      if (row.type === 'lineItemHeader') {
        // Custom styling for line item headers (B2 columns)
        return (
          <div className={`flex items-center justify-start px-2 h-full ${lineItemHeaderB2Classes}`}>
            <div className={lineItemHeaderB2TextClasses}>
              {value}
            </div>
          </div>
        );
      }
      if (row.type === 'lineItem') {
        // Custom styling for line item data (B2 columns)
        return (
          <div className={`flex items-center justify-start px-2 h-full ${lineItemDataB2Classes}`}>
            <div className={lineItemDataB2TextClasses}>
              {value}
            </div>
          </div>
        );
      }
      if (row.type === 'order') {
        // Order row styling - conditional based on expansion
        const isOrderExpanded = expandedOrders.has(row.orderId);
        const orderClasses = isOrderExpanded ? orderExpandedBColumnClasses : orderBColumnClasses;
        const orderTextClasses = isOrderExpanded ? orderExpandedBColumnTextClasses : orderBColumnTextClasses;
        return (
          <div className={`flex items-center justify-center px-2 h-full ${orderClasses}`}>
            <div className={orderTextClasses}>
              {value}
            </div>
          </div>
        );
      }
      // For all other row types, return the value so Table.jsx renders it normally
      return value;
    },
    
    Revenue: (value, row) => {
      if (row.type === 'lineItemHeader') {
        // Custom styling for line item headers (B2 columns)
        return (
          <div className={`flex items-center justify-start px-2 h-full ${lineItemHeaderB2Classes}`}>
            <div className={lineItemHeaderB2TextClasses}>
              {value}
            </div>
          </div>
        );
      }
      if (row.type === 'lineItem') {
        // Custom styling for line item data (B2 columns)
        return (
          <div className={`flex items-center justify-start px-2 h-full ${lineItemDataB2Classes}`}>
            <div className={lineItemDataB2TextClasses}>
              {value}
            </div>
          </div>
        );
      }
      if (row.type === 'order') {
        // Order row styling - conditional based on expansion
        const isOrderExpanded = expandedOrders.has(row.orderId);
        const orderClasses = isOrderExpanded ? orderExpandedBColumnClasses : orderBColumnClasses;
        const orderTextClasses = isOrderExpanded ? orderExpandedBColumnTextClasses : orderBColumnTextClasses;
        return (
          <div className={`flex items-center justify-center px-2 h-full ${orderClasses}`}>
            <div className={orderTextClasses}>
              {value}
            </div>
          </div>
        );
      }
      // For all other row types, return the value so Table.jsx renders it normally
      return value;
    }
  };

  const tableData = {
    columnKeys: ['Date', 'Orders', 'Items', 'Revenue'],
    rows: buildRows(),
    totals: {
      Date: 'Total',
      Orders: `${sampleDayData.orderCount}`,
      Items: sampleDayData.itemCount.toString(),
      Revenue: sampleDayData.revenue
    },
    rowCount: buildRows().length,
    columnCount: 4
  };

  return (
    <div className="h-full border border-gray-100 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Table
          table={tableData}
          customHeaderRenderer={customHeaderRenderer}
          customCellRenderer={customCellRenderer}
          columnLabels={{
            Date: 'Date',
            Orders: 'Orders',
            Items: 'Items',
            Revenue: 'Amount'
          }}
          placeholderRows={0}
          placeholderCols={0}
          height="auto"
          firstColWidth={112}
          metricColWidth={86}
          headerHeight={35}
          rowHeight={35}
          footerHeight={35}
          containerBorder=""
          containerShadow=""
          containerRounded="rounded-xl"
          containerClasses="h-auto border-t flex flex-col overflow-hidden shadow-xl rounded-b-xl"
          a1Rounded="rounded-none"
          a3Rounded="rounded-none"
          b1Rounded="rounded-none"
          b3Rounded="rounded-none"
          headerClasses="flex border-b"
          footerClasses={footerClasses}
          a1Classes="bg-gradient-to-t from-gray-200 via-gray-50 to-gray-100"
          a2Classes="border-r border-gray-200"
          a3Classes="border-r border-gray-100"
          b1Classes="border-b border-r  border-300 border-t bg-gradient-to-b from-gray-50 via-gray-50 to-gray-200"
          b2Classes="bg-gradient-to-b from-white via-white to-gray-100 shadow-xl"
          b3Classes="border-t border-gray-200"
          {...otherProps}
        />
      </div>
    </div>
  );
}