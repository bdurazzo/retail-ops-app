import React, { useState } from "react";
import { objectTags, vectorTags, timeTags, contextTags } from "../features/analytics/components/filters/filterTagRegistry";

export function AssistantPanel() {
  const [selectedTags, setSelectedTags] = useState([]);

  const toggleTag = (value) => {
    setSelectedTags((prev) =>
      prev.includes(value)
        ? prev.filter((tag) => tag !== value)
        : [...prev, value]
    );
  };

  // Simple generator function for preview
  const generatePreview = () => {
    const objects = selectedTags.filter((tag) => objectTags.some((t) => t.value === tag)).map((tag) => tag.label);
    const vectors = selectedTags.filter((tag) => vectorTags.some((t) => t.value === tag)).map((tag) => tag.label);
    const times = selectedTags.filter((tag) => timeTags.some((t) => t.value === tag)).map((tag) => tag.label);
    const contexts = selectedTags.filter((tag) => contextTags.some((t) => t.value === tag)).map((tag) => tag.label);

    if (!objects.length && !vectors.length) return "Select tags to build a query...";

    return `Show ${vectors.join(", ")} for ${objects.join(", ")} ${contexts.length ? "in " + contexts.join(", ") : ""} ${times.length ? "during " + times.join(", ") : ""}`.trim();
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">LLM Query Builder Sandbox</h1>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-600 mb-2">Select Tags:</h2>
        <div className="flex flex-wrap gap-2">
          {[...objectTags, ...vectorTags, ...timeTags, ...contextTags].map((tag) => (
            <button
              key={tag.value}
              onClick={() => toggleTag(tag.value)}
              className={`px-3 py-1 rounded-full text-sm border ${
                selectedTags.includes(tag.value)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-md border text-gray-800">
        <strong className="block text-sm mb-1 text-gray-500">Query Preview:</strong>
        <p className="text-base italic">{generatePreview()}</p>
      </div>
    </div>
  );
}