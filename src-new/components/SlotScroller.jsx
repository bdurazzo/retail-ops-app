import React, { useState, useEffect, useRef } from 'react';

const SlotScroller = ({
  items = [],
  selectedValue = null,
  onValueChange = () => {},
  height = 80,
  itemHeight = 20,
  visibleItems = 3,
  className = "",
  showArrows = true,
  scrollCoordinator = null,
  // Style props for internal elements
  containerBgClassName = "bg-gradient-to-t from-gray-300 via-gray-200 to-gray-100",
  topMaskClassName = "bg-gradient-to-b from-gray-100 via-white to-gray-50 border border-gray-100",
  bottomMaskClassName = "bg-gradient-to-t from-gray-100 via-gray-50 to-gray-100 border border-gray-100",
  highlightClassName = "bg-gradient-to-r from-gray-700 via-gray-600 to-gray-900 border border-gray-400",
  arrowUpClassName = "bg-gradient-to-t from-gray-50 via-white to-gray-50 shadow-lg rounded-full w-6 h-6 border-2 border-gray-200",
  arrowDownClassName = "bg-gradient-to-b from-gray-50 via-white to-gray-100 shadow-lg rounded-full w-6 h-6 border-2 border-gray-200",
  itemClassName = "flex items-center justify-center text-center cursor-pointer relative",
  // Font size controls
  centerFontSize = "1rem",
  edgeFontSize = "0.5rem",
  centerFontWeight = 600,
  edgeFontWeight = 300
}) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollerRef = useRef(null);
  const itemsRef = useRef([]);
  const lastScrolledValueRef = useRef(null);

  // Find initial selected index
  useEffect(() => {
    if (selectedValue !== null) {
      const index = items.findIndex(item =>
        typeof item === 'object' ? item.value === selectedValue : item === selectedValue
      );
      if (index >= 0 && selectedValue !== lastScrolledValueRef.current) {
        lastScrolledValueRef.current = selectedValue;
        setSelectedIndex(index);
        scrollToIndex(index, false);
      }
    }
  }, [selectedValue, items]);

  const scrollToIndex = (index, smooth = true) => {
    if (!scrollerRef.current || !itemsRef.current[index]) return;
    
    itemsRef.current[index].scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'center'
    });
  };

  const findCenterItem = () => {
    if (!scrollerRef.current) return -1;
    
    // Calculate based on scroll position and item positions, accounting for scrollbar
    const scrollTop = scrollerRef.current.scrollTop;
    const containerHeight = height; // Use the full container height, not clientHeight
    const paddingTop = height / 2;
    
    // The center of the visible area relative to content
    const visibleCenter = scrollTop + containerHeight / 2;
    
    // Find which item's center is closest to the visible center
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    items.forEach((item, index) => {
      const itemTop = paddingTop + (index * itemHeight);
      const itemCenter = itemTop + itemHeight / 2;
      const distance = Math.abs(itemCenter - visibleCenter);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    return closestIndex;
  };

  const handleScroll = () => {
    if (!scrollerRef.current) return;
    
    const currentScrollTop = scrollerRef.current.scrollTop;
    setScrollTop(currentScrollTop);
    
    const centerIndex = findCenterItem();
    if (centerIndex >= 0 && centerIndex !== selectedIndex) {
      setSelectedIndex(centerIndex);
    }
  };

  // Let CSS scroll-snap handle the locking, just detect final values
  useEffect(() => {
    if (!scrollerRef.current) return;
    
    let timeoutId;
    
    const handleScrollEnd = () => {
      // Notify coordinator that this scroller is active
      if (scrollCoordinator) {
        scrollCoordinator.notifyScrollActivity();
      }
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (scrollerRef.current) {
          const clampedIndex = findCenterItem();

          setSelectedIndex(clampedIndex);

          // Auto-apply value after scroll settles
          const selectedItem = items[clampedIndex];
          if (selectedItem) {
            const value = typeof selectedItem === 'object' ? selectedItem.value : selectedItem;
            onValueChange(value, clampedIndex);
          }
        }
      }, 200);
    };

    const scrollerElement = scrollerRef.current;
    scrollerElement.addEventListener('scroll', handleScrollEnd);
    
    return () => {
      clearTimeout(timeoutId);
      scrollerElement.removeEventListener('scroll', handleScrollEnd);
    };
  }, [itemHeight, items, onValueChange]);

  const handleArrowClick = (direction) => {
    const newIndex = direction === 'up' 
      ? Math.max(0, selectedIndex - 1)
      : Math.min(items.length - 1, selectedIndex + 1);
    
    setSelectedIndex(newIndex);
    scrollToIndex(newIndex, true);
    // Don't auto-apply - only apply when highlight is clicked
  };

  const renderItem = (item, index, isOverlay = false) => {
    const distance = Math.abs(index - selectedIndex);
    const opacity = Math.max(0.4, 1 - (distance * 0.15));
    const scale = Math.max(0.85, 1 - (distance * 0.08));

    // Calculate gradient transition from dark to white based on distance from center
    const paddingOffset = height / 2;
    const itemCenterPosition = (index * itemHeight) + (itemHeight / 2) - scrollTop + paddingOffset;
    const containerCenterPosition = height / 2;
    const distanceFromCenter = Math.abs(itemCenterPosition - containerCenterPosition);
    
    // Simple linear interpolation based on distance from exact center
    const normalizedDistance = Math.min(1, distanceFromCenter / (itemHeight * 2));
    
    // Linear transition from white (0) to gray (1)
    const r = Math.round(255 - (normalizedDistance * 159)); // 255 to 96
    const g = Math.round(255 - (normalizedDistance * 159)); // 255 to 96  
    const b = Math.round(255 - (normalizedDistance * 159)); // 255 to 96
    
    const textColor = `rgb(${r}, ${g}, ${b})`;
    
    const label = typeof item === 'object' ? item.label : item;
    
    const baseStyle = {
      height: itemHeight,
      opacity,
      transform: `scale(${scale})`,
      color: textColor,
      fontWeight: normalizedDistance < 0.2 ? centerFontWeight : edgeFontWeight,
      fontSize: normalizedDistance < 0.5 ? centerFontSize : edgeFontSize
    };

    const overlayStyle = isOverlay ? {
      ...baseStyle,
      position: 'absolute',
      top: index * itemHeight,
      width: '100%'
    } : baseStyle;
    
    return (
      <div
        key={isOverlay ? `overlay-${index}` : index}
        ref={isOverlay ? null : el => itemsRef.current[index] = el}
        className={itemClassName}
        style={{
          scrollSnapAlign: 'center',
          scrollSnapStop: 'always',
          ...overlayStyle
        }}
        onClick={isOverlay ? undefined : () => {
          setSelectedIndex(index);
          scrollToIndex(index, true);
          const value = typeof item === 'object' ? item.value : item;
          onValueChange(value, index);
        }}
      >
        {label}
      </div>
    );
  };

  return (
    <div className={`relative ${containerBgClassName} rounded shadow-xl ${className}`} style={{ height }}
      >
      {/* Top mask box - opaque cover for top third */}
      <div
        className={`absolute top-0 left-0 right-0 ${topMaskClassName} z-[50] pointer-events-none`}
        style={{
          height: height / 3.4,

        }}
      />
      {/* Top mask border */}
      <div
        className="absolute left-0 right-0  z-[51] pointer-events-none"
        style={{ top: height / 3 }}
      />
        <div
         className={`absolute bottom-0 left-0 right-0 ${bottomMaskClassName} z-[50] pointer-events-none`}
         style={{
           height: height / 3.5
         }}
        />
      {/* Bottom mask border */}
      <div
        className="absolute left-0 right-0 z-[51] pointer-events-none"
        style={{ bottom: height / 4 }}
      />

      {/* Arrows */}
      {showArrows && (
        <>
          <button
            className={`absolute top-1 left-1/2 transform -translate-x-1/2 z-[60]
                       flex items-center justify-center hover:from-gray-300 hover:via-gray-100 hover:to-gray-100
                       transition-all text-gray-700 disabled:opacity-70 disabled:cursor-not-allowed ${arrowUpClassName}`}
            onClick={() => handleArrowClick('up')}
            disabled={selectedIndex === 0}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14l5-5 5 5z"/>
            </svg>
          </button>

          <button
            className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 z-[100]
                       flex items-center justify-center hover:from-gray-300 hover:via-gray-100 hover:to-gray-100
                       transition-all text-gray-700 disabled:opacity-70 disabled:cursor-not-allowed ${arrowDownClassName}`}
            onClick={() => handleArrowClick('down')}
            disabled={selectedIndex === items.length - 1}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
        </>
      )}

      {/* Scroller */}
      <div
        ref={scrollerRef}
        className="h-full overflow-y-scroll scrollbar-hide px-2 relative z-[30]"
        onScroll={handleScroll}
        style={{ 
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          paddingTop: height / 2,
          paddingBottom: height / 2,
          WebkitMask: 'linear-gradient(to bottom, transparent 10px, black 40px, black calc(100% - 30px), transparent 100%)',
          mask: 'linear-gradient(to bottom, transparent 10px, black 40px, black calc(100% - 30px), transparent 100%)'
        }}
      >
        {items.map((item, index) => renderItem(item, index, false))}
      </div>

      {/* Selection highlight */}
      <div
        className={`absolute left-0 right-0  cursor-pointer z-[20] rounded ${highlightClassName}`}
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          height: itemHeight,
          opacity: 1,
        }}
        onClick={() => {
          console.log('Highlight clicked, selectedIndex:', selectedIndex, 'item:', items[selectedIndex]);
          // Just apply whatever selectedIndex currently is
          const selectedItem = items[selectedIndex];
          if (selectedItem) {
            const value = typeof selectedItem === 'object' ? selectedItem.value : selectedItem;
            console.log('Applying value:', value);
            onValueChange(value, selectedIndex);
          }
        }}
      />
    </div>
  );
};

export default SlotScroller;