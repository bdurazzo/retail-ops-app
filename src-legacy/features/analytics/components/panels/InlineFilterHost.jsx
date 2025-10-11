import React, { useEffect, useRef, useState } from "react";

// Simple, non-animated host to render a filter panel inline
// Reuses the panel's onRegister to obtain an apply() payload
export default function InlineFilterHost({
  PanelComponent,
  panelProps = {},
  onApply,
  onReset,
  className = "",
}) {
  const applyFnRef = useRef(null);
  const [resetNonce, setResetNonce] = useState(0);

  const handleRegister = (fn) => {
    applyFnRef.current = typeof fn === "function" ? fn : null;
  };

  return (
    <div className={className}>
      <div className="border border-gray-200 bg-white rounded-md overflow-hidden">
        <div className="h-[280px] overflow-y-auto">
          {PanelComponent ? (
            <PanelComponent
              resetNonce={resetNonce}
              onRegister={handleRegister}
              {...panelProps}
            />
          ) : (
            <div className="text-sm text-gray-500 p-3">No panel configured for this tab yet.</div>
          )}
        </div>
        <div className="border-t border-gray-200 px-4 py-2 flex justify-end bg-gradient-b from-white to-gray-50 gap-3">
          <button
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={() => {
              setResetNonce((n) => n + 1);
              onReset?.();
            }}
          >
            Reset
          </button>
          <button
            className="bg-gray-900 text-white px-3 py-1 text-sm rounded-md hover:bg-gray-800"
            onClick={async () => {
              let applied = null;
              if (applyFnRef.current) {
                applied = await applyFnRef.current();
              }
              onApply?.(applied);
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

