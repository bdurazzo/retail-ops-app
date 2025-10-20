/**
 * PairAnalysisPluginPanel
 * Configuration panel for coupled pairs analysis system
 */

import React, { useState, useRef } from 'react';
import SlotScroller from '../../../../components/SlotScroller.jsx';
import { IconBriefcaseFilled, IconTemperaturePlusFilled, IconChartDots2Filled } from '@tabler/icons-react';

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

export default function PairAnalysisPluginPanel({
  onPanelStateChange,
  panelCommand,
  // Container props
  containerClassName = "flex flex-col bg-gray-50 p-4",
  headerClassName = "flex items-center justify-center text-sm text-gray-700 font-semibold mb-3",
  headerText = "Pair Analysis Configuration",
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
    table1Size: 10,
    table2Size: 10,
    pairSize: 10,
    weighting: 'equal'
  });

  const scrollCoordinatorRef = useRef(null);
  if (!scrollCoordinatorRef.current) {
    scrollCoordinatorRef.current = new ScrollCoordinator(() => {
      // This fires after all scrollers have been idle for the delay
      if (onPanelStateChange) {
        onPanelStateChange(selectedParams);
      }
    }, 500);
  }

  // Slot 1: Table 1 Sample Size
  const slot1Items = [5, 10, 15, 20, 25];
  const slot1Index = slot1Items.indexOf(selectedParams.table1Size);

  const handleSlot1Change = (index) => {
    const value = slot1Items[index];
    setSelectedParams(prev => ({ ...prev, table1Size: value }));
    scrollCoordinatorRef.current.scheduleApply(() => {
      console.log('Table 1 size changed:', value);
    });
  };

  // Slot 2: Table 2 Sample Size
  const slot2Items = [5, 10, 15, 20, 25];
  const slot2Index = slot2Items.indexOf(selectedParams.table2Size);

  const handleSlot2Change = (index) => {
    const value = slot2Items[index];
    setSelectedParams(prev => ({ ...prev, table2Size: value }));
    scrollCoordinatorRef.current.scheduleApply(() => {
      console.log('Table 2 size changed:', value);
    });
  };

  // Slot 3: Pair Sample Size
  const slot3Items = [10, 20, 30, 50, 100];
  const slot3Index = slot3Items.indexOf(selectedParams.pairSize);

  const handleSlot3Change = (index) => {
    const value = slot3Items[index];
    setSelectedParams(prev => ({ ...prev, pairSize: value }));
    scrollCoordinatorRef.current.scheduleApply(() => {
      console.log('Pair size changed:', value);
    });
  };

  // Build footer text
  const footerText = `Show top ${selectedParams.table1Size} × ${selectedParams.table2Size} = ${selectedParams.table1Size * selectedParams.table2Size} possible pairs, display top ${selectedParams.pairSize}`;

  return (
    <div className={containerClassName}>
      {/* Header */}
      <div className={headerClassName}>
        {headerText}
      </div>

      {/* Slot Scrollers */}
      <div className={slotsContainerClassName}>
        {/* Slot 1: Table 1 Size */}
        <div className={slotWrapperClassName}>
          <div className={slotLabelClassName}>
            <IconBriefcaseFilled size={14} className="mr-1" />
            Table 1
          </div>
          <SlotScroller
            items={slot1Items}
            selectedIndex={slot1Index}
            onSelectedIndexChange={handleSlot1Change}
            onScrollActivity={() => scrollCoordinatorRef.current.notifyScrollActivity()}
            height={defaultScrollerHeight}
            itemHeight={defaultScrollerItemHeight}
            visibleItems={defaultScrollerVisibleItems}
            showArrows={defaultScrollerShowArrows}
            className={defaultScrollerClassName}
            containerBgClassName={scrollerContainerBgClassName}
            topMaskClassName={scrollerTopMaskClassName}
            bottomMaskClassName={scrollerBottomMaskClassName}
            highlightClassName={scrollerHighlightClassName}
            arrowUpClassName={scrollerArrowUpClassName}
            arrowDownClassName={scrollerArrowDownClassName}
            itemClassName={scrollerItemClassName}
            centerFontSize={scrollerCenterFontSize}
            edgeFontSize={scrollerEdgeFontSize}
            centerFontWeight={scrollerCenterFontWeight}
            edgeFontWeight={scrollerEdgeFontWeight}
          />
        </div>

        {/* Slot 2: Table 2 Size */}
        <div className={slotWrapperClassName}>
          <div className={slotLabelClassName}>
            <IconTemperaturePlusFilled size={14} className="mr-1" />
            Table 2
          </div>
          <SlotScroller
            items={slot2Items}
            selectedIndex={slot2Index}
            onSelectedIndexChange={handleSlot2Change}
            onScrollActivity={() => scrollCoordinatorRef.current.notifyScrollActivity()}
            height={defaultScrollerHeight}
            itemHeight={defaultScrollerItemHeight}
            visibleItems={defaultScrollerVisibleItems}
            showArrows={defaultScrollerShowArrows}
            className={defaultScrollerClassName}
            containerBgClassName={scrollerContainerBgClassName}
            topMaskClassName={scrollerTopMaskClassName}
            bottomMaskClassName={scrollerBottomMaskClassName}
            highlightClassName={scrollerHighlightClassName}
            arrowUpClassName={scrollerArrowUpClassName}
            arrowDownClassName={scrollerArrowDownClassName}
            itemClassName={scrollerItemClassName}
            centerFontSize={scrollerCenterFontSize}
            edgeFontSize={scrollerEdgeFontSize}
            centerFontWeight={scrollerCenterFontWeight}
            edgeFontWeight={scrollerEdgeFontWeight}
          />
        </div>

        {/* Slot 3: Pair Size */}
        <div className={slotWrapperClassName}>
          <div className={slotLabelClassName}>
            <IconChartDots2Filled size={14} className="mr-1" />
            Pairs
          </div>
          <SlotScroller
            items={slot3Items}
            selectedIndex={slot3Index}
            onSelectedIndexChange={handleSlot3Change}
            onScrollActivity={() => scrollCoordinatorRef.current.notifyScrollActivity()}
            height={defaultScrollerHeight}
            itemHeight={defaultScrollerItemHeight}
            visibleItems={defaultScrollerVisibleItems}
            showArrows={defaultScrollerShowArrows}
            className={defaultScrollerClassName}
            containerBgClassName={scrollerContainerBgClassName}
            topMaskClassName={scrollerTopMaskClassName}
            bottomMaskClassName={scrollerBottomMaskClassName}
            highlightClassName={scrollerHighlightClassName}
            arrowUpClassName={scrollerArrowUpClassName}
            arrowDownClassName={scrollerArrowDownClassName}
            itemClassName={scrollerItemClassName}
            centerFontSize={scrollerCenterFontSize}
            edgeFontSize={scrollerEdgeFontSize}
            centerFontWeight={scrollerCenterFontWeight}
            edgeFontWeight={scrollerEdgeFontWeight}
          />
        </div>
      </div>

      {/* Footer */}
      <div className={footerClassName}>
        {footerText}
      </div>
    </div>
  );
}
