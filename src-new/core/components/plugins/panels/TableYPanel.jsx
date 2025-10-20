import React, { useState, useRef } from 'react';
import SlotScroller from '../../../../components/SlotScroller.jsx';
import {IconAwardFilled, IconCalculatorFilled, IconClockHour9Filled, IconLayoutSidebarFilled, IconLayoutSidebarRightFilled, IconShirtFilled, IconTableColumn, IconTableRow, IconTagsFilled} from '@tabler/icons-react'
import { Icon } from 'lucide-react';

class ScrollCoordinator {
  constructor(onApply, delay = 2000) {
    this.onApply = onApply;
    this.delay = delay;
    this.timeoutId = null;
    this.pendingActions = [];
  }

  notifyScrollActivity() {
    clearTimeout(this.timeoutId);
    this.timeoutId = null;
  }

  scheduleApply(action) {
    this.pendingActions.push(action);

    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        this.pendingActions.forEach(action => action());
        this.pendingActions = [];
        this.timeoutId = null;

        if (this.onApply) {
          this.onApply();
        }
      }, this.delay);
    }
  }
}

export default function TableYPanel({
  onPanelStateChange,
  panelCommand,
  // Container props
  containerClassName = "flex flex-col bg-gray-50 p-4",
  headerClassName = "flex items-center justify-center text-sm text-gray-700 font-semibold mb-3",
  headerText = "Table Y Configuration",
  // Slot wrapper props
  slotsContainerClassName = "flex mt-0",
  slotWrapperClassName = "flex-1 flex-row px-1 items-center",
  slotLabelClassName = "flex text-[12px] font-medium text-gray-900 mb-1 justify-center text-center",
  // Footer props
  footerClassName = "mt-3 text-center text-xs font-medium text-gray-700",
  footerSlot1Before = "Filter ",
  footerSlot1After = " by ",
  footerSlot2Before = "",
  footerSlot2After = " with ",
  footerSlot3Before = "",
  footerSlot3After = "",
  // SlotScroller default props
  defaultScrollerHeight = 80,
  defaultScrollerItemHeight = 28,
  defaultScrollerVisibleItems = 3,
  defaultScrollerShowArrows = true,
  defaultScrollerClassName = "w-[100px]",
  // SlotScroller style props
  scrollerContainerBgClassName = "bg-gradient-to-t from-gray-300 via-gray-200 to-gray-100",
  scrollerTopMaskClassName = "bg-gradient-to-b from-gray-100 via-white to-gray-50 border border-gray-100",
  scrollerBottomMaskClassName = "bg-gradient-to-t from-gray-100 via-gray-50 to-gray-100 border border-gray-100",
  scrollerHighlightClassName = "flex justify-center bg-gradient-to-r from-gray-700 via-gray-600 to-gray-900 border border-gray-400",
  scrollerArrowUpClassName = "",
  scrollerArrowDownClassName = "",
  scrollerItemClassName = "flex items-center justify-center text-center cursor-pointer relative",
  scrollerCenterFontSize = "11px",
  scrollerEdgeFontSize = "0.5rem",
  scrollerCenterFontWeight = 600,
  scrollerEdgeFontWeight = 300
}) {
  const [selectedParams, setSelectedParams] = useState({
    tableType: 'all',
    columnType: 'style',
    rowType: 'all'
  });

  const scrollCoordinatorRef = useRef(null);
  if (!scrollCoordinatorRef.current) {
    scrollCoordinatorRef.current = new ScrollCoordinator(() => {
      // This fires after all scrollers have been idle for the delay rowType
    }, 500);
  }

  // Hierarchical slot configuration
  const slotHierarchy = {
    tableType: {
      product: {
        label: 'Products',
        footerBefore: ' Top ',
        footerAfter: ' ',
        children: {
          quantity: {
            label: 'Quantity Sold',
            footerBefore: ' by ',
            footerAfter: '  ',
            children: ['Hour', 'Day', 'Week', 'Month', 'Quarter', 'Year', 'All Time']
          },
          net: {
            label: 'Net Revenue',
            footerBefore: ' ',
            footerAfter: ' ',
            children: ['Hour', 'Day', 'Week', 'Month', 'Quarter', 'Year', 'All Time']
          },
          velocity: {
            label: 'Sales Velocity',
            footerBefore: ' ',
            footerAfter: ' ',
            children: ['Hour', 'Day', 'Week', 'Month', 'Quarter', 'Year', 'All Time']
          },
          attach: {
            label: 'Attach Rate',
            footerBefore: ' ',
            footerAfter: ' by ',
            children: ['Hour', 'Day', 'Week', 'Month', 'Quarter', 'Year', 'All Time']
          },
          product: {
            label: 'Subcategories',
            footerBefore: ' ',
            footerAfter: ' ',
            children: ['' ]
          }
          
        }
      },
      category: {
        label: '',
        footerBefore: 'Generate a table including ',
        footerAfter: ' and ',
        children: {
          variant: {
            label: 'Variants',
            footerBefore: ' ',
            footerAfter: '(s) and ',
            children: ['All Variants', 'Color', 'Size']
          },
          color: {
            label: 'Color',
            footerBefore: ' all ',
            footerAfter: 's by ',
            children: ['Variant']
          },
          size: {
            label: 'Size',
            footerBefore: '',
            footerAfter: ' with ',
            children: ['Variant', 'quarter']
          }
        }
      },
      style: {
        label: 'Category',
        footerBefore: 'filter ',
        footerAfter: ' by ',
        children: {
          mens: {
            label: 'Mens',
            footerBefore: '',
            footerAfter: ' with ',
            children: ['week', 'month', 'quarter']
          },
          womens: {
            label: 'Womens',
            footerBefore: '',
            footerAfter: ' with ',
            children: ['week', 'month', 'quarter']
          },
          kids: {
            label: 'Kids',
            footerBefore: '',
            footerAfter: ' with ',
            children: ['month', 'quarter']
          }
        }
      },
      brand: {
        label: 'Brand',
        footerBefore: 'filter ',
        footerAfter: ' by ',
        children: {
          nike: {
            label: 'Nike',
            footerBefore: '',
            footerAfter: ' with ',
            children: ['day', 'week', 'month']
          },
          adidas: {
            label: 'Adidas',
            footerBefore: '',
            footerAfter: ' with ',
            children: ['day', 'week', 'month']
          },
          puma: {
            label: 'Puma',
            footerBefore: '',
            footerAfter: ' with ',
            children: ['week', 'month']
          }
        }
      }
    }
  };

  // Get slot 1 items (static)
  const getSlot1Items = () => {
    return Object.keys(slotHierarchy.tableType).map(key => {
      const item = slotHierarchy.tableType[key];
      return {
        value: key,
        icon: item.icon,
        label: item.label,
        footerBefore: item.footerBefore,
        footerAfter: item.footerAfter
      };
    });
  };

  // Get slot 2 items based on slot 1 selection
  const getSlot2Items = (slot1Value) => {
    const slot1Data = slotHierarchy.tableType[slot1Value];
    if (!slot1Data || !slot1Data.children) return [];

    return Object.keys(slot1Data.children).map(key => {
      const item = slot1Data.children[key];
      return {
        value: key,
        label: item.label,
        footerBefore: item.footerBefore,
        footerAfter: item.footerAfter
      };
    });
  };

  // Get slot 3 items based on slot 1 and slot 2 selections
  // Children are simple strings - the string is BOTH the value and label
  const getSlot3Items = (slot1Value, slot2Value) => {
    const slot1Data = slotHierarchy.tableType[slot1Value];
    if (!slot1Data || !slot1Data.children) return [];

    const slot2Data = slot1Data.children[slot2Value];
    if (!slot2Data || !slot2Data.children) return [];

    return slot2Data.children.map(str => ({
      value: str,
      label: str,
      footerBefore: '',
      footerAfter: ''
    }));
  };

  const tableSlots = [
    {
      key: 'tableType',
      icon: IconTableColumn,
      label: 'Primary',
      items: getSlot1Items(),
      footerBefore: 'filter ',
      footerAfter: ' by '
    },
    {
      key: 'columnType',
      icon: IconTableRow,
      label: 'Secondary',
      items: getSlot2Items(selectedParams.tableType),
      footerBefore: '',
      footerAfter: ' with '
    },
    {
      key: 'rowType',
      icon: IconClockHour9Filled,
      label: 'Time',
      items: getSlot3Items(selectedParams.tableType, selectedParams.columnType),
      footerBefore: '',
      footerAfter: ''
    }
];

  const handleValueChange = (key, value) => {
    setSelectedParams(prev => {
      const newParams = { ...prev, [key]: value };

      // Auto-adjust dependent values ONLY if current value becomes invalid
      if (key === 'tableType') {
        const newSlot2Items = getSlot2Items(value);

        // Check if current slot 2 value is still valid
        const isValidGroup = newSlot2Items.some(item => item.value === prev.columnType);
        if (!isValidGroup && newSlot2Items.length > 0) {
          // Slot 2 value is invalid, reset to first option
          newParams.columnType = newSlot2Items[0].value;
        }

        // Check if current slot 3 value is still valid with the (possibly new) slot 2 value
        const newSlot3Items = getSlot3Items(value, newParams.columnType);
        const isValidFeature = newSlot3Items.some(item => item.value === prev.rowType);
        if (!isValidFeature && newSlot3Items.length > 0) {
          // Slot 3 value is invalid, reset to first option
          newParams.rowType = newSlot3Items[0].value;
        }
      } else if (key === 'columnType') {
        // Check if current slot 3 value is still valid
        const newSlot3Items = getSlot3Items(prev.tableType, value);
        const isValidFeature = newSlot3Items.some(item => item.value === prev.rowType);
        if (!isValidFeature && newSlot3Items.length > 0) {
          // Slot 3 value is invalid, reset to first option
          newParams.rowType = newSlot3Items[0].value;
        }
      }

      if (onPanelStateChange) {
        onPanelStateChange(newParams);
      }
      return newParams;
    });
  };

  return (
    <div className={containerClassName}>
      <div className={headerClassName}>
        <IconLayoutSidebarFilled size={16} className="mr-2" />
        {headerText}
      </div>

      <div className={slotsContainerClassName}>
        {tableSlots.map(slot => (
          <div key={slot.key} className={slot.wrapperClassName || slotWrapperClassName}>
            <div className={`${slot.labelClassName || slotLabelClassName} flex flex-col items-center`}>
              {slot.icon && <slot.icon size={22} className="mb-1" />}
              {slot.label}
            </div>
            <SlotScroller
              items={slot.items}
              selectedValue={selectedParams[slot.key]}
              onValueChange={(value) => handleValueChange(slot.key, value)}
              height={slot.height !== undefined ? slot.height : defaultScrollerHeight}
              itemHeight={slot.itemHeight !== undefined ? slot.itemHeight : defaultScrollerItemHeight}
              visibleItems={slot.visibleItems !== undefined ? slot.visibleItems : defaultScrollerVisibleItems}
              showArrows={slot.showArrows !== undefined ? slot.showArrows : defaultScrollerShowArrows}
              scrollCoordinator={scrollCoordinatorRef.current}
              className={slot.scrollerClassName || defaultScrollerClassName}
              containerBgClassName={slot.containerBgClassName || scrollerContainerBgClassName}
              topMaskClassName={slot.topMaskClassName || scrollerTopMaskClassName}
              bottomMaskClassName={slot.bottomMaskClassName || scrollerBottomMaskClassName}
              highlightClassName={slot.highlightClassName || scrollerHighlightClassName}
              arrowUpClassName={slot.arrowUpClassName || scrollerArrowUpClassName}
              arrowDownClassName={slot.arrowDownClassName || scrollerArrowDownClassName}
              itemClassName={slot.itemClassName || scrollerItemClassName}
              centerFontSize={slot.centerFontSize || scrollerCenterFontSize}
              edgeFontSize={slot.edgeFontSize || scrollerEdgeFontSize}
              centerFontWeight={slot.centerFontWeight !== undefined ? slot.centerFontWeight : scrollerCenterFontWeight}
              edgeFontWeight={slot.edgeFontWeight !== undefined ? slot.edgeFontWeight : scrollerEdgeFontWeight}
            />
          </div>
        ))}
      </div>

      <div className={footerClassName}>
        {(() => {
          // Build sentence from slots using item-specific footerBefore/After
          let sentence = '';

          tableSlots.forEach(slot => {
            const item = slot.items?.find(i => i.value === selectedParams[slot.key]);
            if (item) {
              const label = item.label.toLowerCase();
              const before = item.footerBefore || '';
              const after = item.footerAfter || '';
              sentence += `${before}${label}${after}`;
            }
          });

          // Capitalize first letter only
          return sentence.charAt(0).toUpperCase() + sentence.slice(1);
        })()}
      </div>
    </div>
  );
}
