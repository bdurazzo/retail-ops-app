import React from "react";

export default function QueryBox({ value, onChange, onSubmit }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSubmit(value);
    }
  };

  return (
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question about the data..."
        className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
      />
      <button
        onClick={() => onSubmit(value)}
        className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
      >
        Submit
      </button>
    </div>
  );
}
