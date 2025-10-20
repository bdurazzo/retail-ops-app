import React, { useState, useRef } from 'react';
import SlotScroller from '../../../../components/SlotScroller.jsx';
import { IconCalculatorFilled, IconChartDotsFilled, IconClockHour9Filled } from '@tabler/icons-react';

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

export default function MetricPluginPanel({
  onPanelStateChange,
  panelCommand,
  // Container props
  containerClassName = "flex flex-col bg-gray-50 p-4",
  headerClassName = "flex items-center justify-center text-sm text-gray-700 font-semibold mb-3",
  headerText = "Metric Configuration",
  // Slot wrapper props
  slotsContainerClassName = "flex mt-0",
  slotWrapperClassName = "flex-1 flex-row px-1 items-center",
  slotLabelClassName = "flex text-[12px] font-medium text-gray-900 mb-1 justify-center text-center",
  // Footer props
  footerClassName = "mt-3 text-center text-xs font-medium text-gray-700",
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
    metricType: 'revenue',
    calculation: 'total',
    timeframe: 'month'
  });

  const scrollCoordinatorRef = useRef(null);
  if (!scrollCoordinatorRef.current) {
    scrollCoordinatorRef.current = new ScrollCoordinator(() => {
      // This fires after all scrollers have been idle for the delay
    }, 500);
  }

  // Hierarchical slot configuration
  const slotHierarchy = {
    metricType: {
      revenue: {
        label: 'Revenue',
        footerBefore: 'Show ',
        footerAfter: ' ',
        children: {
          total: {
            label: 'Total',
            footerBefore: '',
            footerAfter: ' over ',
            children: ['Day', 'Week', 'Month', 'Quarter', 'Year', 'All Time']
          },
          average: {
            label: 'Average',
            footerBefore: '',
            footerAfter: ' over ',
            children: ['Day', 'Week', 'Month', 'Quarter', 'Year']
          },
          growth: {
            label: 'Growth',
            footerBefore: '',
            footerAfter: ' over ',
            children: ['Week', 'Month', 'Quarter', 'Year']
          }
        }
      },
      quantity: {
        label: 'Quantity',
        footerBefore: 'Show ',
        footerAfter: ' ',
        children: {
          total: {
            label: 'Total',
            footerBefore: '',
            footerAfter: ' over ',
            children: ['Day', 'Week', 'Month', 'Quarter', 'Year', 'All Time']
          },
          average: {
            label: 'Average',
            footerBefore: '',
            footerAfter: ' over ',
            children: ['Day', 'Week', 'Month', 'Quarter', 'Year']
          },
          trend: {
            label: 'Trend',
            footerBefore: '',
            footerAfter: ' over ',
            children: ['Week', 'Month', 'Quarter', 'Year']
          }
        }
      },
      orders: {
        label: 'Orders',
        footerBefore: 'Show ',
        footerAfter: ' ',
        children: {
          count: {
            label: 'Count',
            footerBefore: '',
            footerAfter: ' over ',
            children: ['Day', 'Week', 'Month', 'Quarter', 'Year', 'All Time']
          },
          average: {
            label: 'Average Value',
            footerBefore: '',
            footerAfter: ' over ',
            children: ['Day', 'Week', 'Month', 'Quarter', 'Year']
          }
        }
      }
    }
  };

  // Get slot 1 items (static)
  const getSlot1Items = () => {
    return Object.keys(slotHierarchy.metricType).map(key => {
      const item = slotHierarchy.metricType[key];
      return {
        value: key,
        label: item.label,
        footerBefore: item.footerBefore,
        footerAfter: item.footerAfter
      };
    });
  };

  // Get slot 2 items based on slot 1 selection
  const getSlot2Items = (slot1Value) => {
    const slot1Data = slotHierarchy.metricType[slot1Value];
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
  const getSlot3Items = (slot1Value, slot2Value) => {
    const slot1Data = slotHierarchy.metricType[slot1Value];
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

  const metricSlots = [
    {
      key: 'metricType',
      icon: IconCalculatorFilled,
      label: 'Metric',
      items: getSlot1Items(),
      footerBefore: 'Show ',
      footerAfter: ' '
    },
    {
      key: 'calculation',
      icon: IconChartDotsFilled,
      label: 'Calculation',
      items: getSlot2Items(selectedParams.metricType),
      footerBefore: '',
      footerAfter: ' over '
    },
    {
      key: 'timeframe',
      icon: IconClockHour9Filled,
      label: 'Time',
      items: getSlot3Items(selectedParams.metricType, selectedParams.calculation),
      footerBefore: '',
      footerAfter: ''
    }
  ];

  const handleValueChange = (key, value) => {
    setSelectedParams(prev => {
      const newParams = { ...prev, [key]: value };

      // Auto-adjust dependent values ONLY if current value becomes invalid
      if (key === 'metricType') {
        const newSlot2Items = getSlot2Items(value);

        // Check if current slot 2 value is still valid
        const isValidCalculation = newSlot2Items.some(item => item.value === prev.calculation);
        if (!isValidCalculation && newSlot2Items.length > 0) {
          newParams.calculation = newSlot2Items[0].value;
        }

        // Check if current slot 3 value is still valid
        const newSlot3Items = getSlot3Items(value, newParams.calculation);
        const isValidTimeframe = newSlot3Items.some(item => item.value === prev.timeframe);
        if (!isValidTimeframe && newSlot3Items.length > 0) {
          newParams.timeframe = newSlot3Items[0].value;
        }
      } else if (key === 'calculation') {
        // Check if current slot 3 value is still valid
        const newSlot3Items = getSlot3Items(prev.metricType, value);
        const isValidTimeframe = newSlot3Items.some(item => item.value === prev.timeframe);
        if (!isValidTimeframe && newSlot3Items.length > 0) {
          newParams.timeframe = newSlot3Items[0].value;
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
        <IconCalculatorFilled size={16} className="mr-2" />
        {headerText}
      </div>

      <div className={slotsContainerClassName}>
        {metricSlots.map(slot => (
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

          metricSlots.forEach(slot => {
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
