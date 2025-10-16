/**
 * PluginButton - Plain button template
 */

import React from 'react';

export default function PluginButton({
  plugin,
  onDragStart,
  wrapperClassName = "inline-flex flex-col rounded-xl items-center gap-1",
  containerClassName = "w-7 h-7 items-center justify-center border border-gray-200 p-0.5 rounded bg-gradient-to-t from-gray-200 via-white to-gray-100 cursor-grab hover:bg-gray-50",
  iconClassName = "text-gray-500",
  labelClassName = "text-[11px] text-gray-600 font-medium whitespace-nowrap",
  iconSize = 20,
  iconStroke = 1.5,
  ...props
}) {
  const handleDragStart = (e) => {
    // Create custom drag image with styling
    const dragImage = e.currentTarget.cloneNode(true);
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, e.currentTarget.offsetWidth / 2, e.currentTarget.offsetHeight / 2);
    setTimeout(() => document.body.removeChild(dragImage), 0);

    onDragStart?.(e, plugin);
  };

  const Icon = plugin?.icon;

  return (
    <div className={wrapperClassName}>
      <div
        draggable
        onDragStart={handleDragStart}
        className={`flex items-center ${containerClassName}`}
      >

        {Icon && <Icon size={iconSize} stroke={iconStroke} className={iconClassName} />}

      </div>
        <span className={labelClassName}>{plugin?.label || 'Plugin'}</span>
    </div>
  );
}
