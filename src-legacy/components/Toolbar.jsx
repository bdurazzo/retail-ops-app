import React from 'react';

export default function Toolbar({ 
  children, 
  leftContent, 
  rightContent, 
  centerContent, 
  centerJustify = 'center',
  height = 12,           // Tailwind h-12 (48px) by default
  borderWidth = 2,       // border-b-2 by default  
  shadowSize = 'xl',     // shadow-xl by default
  paddingX = 2,          // px-2 by default
  centerPaddingX = 3,    // px-3 by default for center content
  rounded = 'rounded'    // rounded corners by default
}) {
  // Convert numeric height to Tailwind class or use custom style
  const heightClass = typeof height === 'number' ? `h-${height}` : height;
  const borderClass = `border-b-${borderWidth}`;
  const shadowClass = `shadow-${shadowSize}`;
  const paddingClass = `px-${paddingX}`;
  const centerPaddingClass = `px-${centerPaddingX}`;

  return (
    <div className={`${heightClass} ${borderClass} border-gray-50 bg-gradient-to-b from-gray-200 via-white to-gray-50 ${shadowClass} ${rounded} grid grid-cols-[auto,1fr,auto] items-center ${paddingClass}`}>
      {/* Left side */}
      <div className="flex items-center space-x-2">
        {leftContent || children}
      </div>

      {/* Center section (fixed column so right side never shifts) */}
      <div className={`flex items-center ${centerPaddingClass} overflow-hidden ${centerJustify === 'start' ? 'justify-start' : 'justify-center'}`}>
        {centerContent || null}
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-2 justify-self-end">
        {rightContent}
      </div>
    </div>
  );
}
