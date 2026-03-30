import React from "react";

interface LinkifyProps {
  text: string;
  className?: string;
}

export function Linkify({ text, className }: LinkifyProps) {
  if (!text) return null;

  // Regex to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Split the text by URLs. The regex with capture group ensures URLs are kept in the resulting array.
  const parts = text.split(urlRegex);

  return (
    <div className={className}>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
