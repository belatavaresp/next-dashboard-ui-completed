"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { PUBLIC_IMAGES } from "@/lib/publicImages";
import { inputClass } from "@/components/forms/FormShell";

type ImageUrlInputProps = {
  value: string;
  onChange: (value: string) => void;
};

/**
 * Text input for a cover URL that suggests the images bundled in public/.
 * Free text is still allowed, since covers may be any external URL.
 */
export default function ImageUrlInput({ value, onChange }: ImageUrlInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Once the field holds an external URL, local files are no longer a useful
  // suggestion and the list would just cover the preview below.
  const isExternalUrl = /^https?:\/\//i.test(value.trim());

  const suggestions = useMemo(() => {
    const term = value.trim().toLowerCase().replace(/^\//, "");
    if (!term) return PUBLIC_IMAGES;
    return PUBLIC_IMAGES.filter((path) =>
      path.toLowerCase().replace(/^\//, "").includes(term)
    );
  }, [value]);

  const isListOpen = isOpen && !isExternalUrl;

  useEffect(() => {
    setHighlighted(0);
  }, [value]);

  // Close when focus or a click lands outside the field and its list.
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const select = (path: string) => {
    onChange(path);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (!isListOpen || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((index) => (index - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(suggestions[highlighted]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className={inputClass}
        placeholder="/alavanca.png ou https://..."
        role="combobox"
        aria-expanded={isListOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
      />

      {isListOpen && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <p className="border-b border-gray-100 px-3 py-2 text-xs text-gray-500">
            {suggestions.length > 0
              ? "Imagens disponíveis no projeto (ou digite uma URL externa)"
              : "Nenhuma imagem local corresponde. Você pode usar uma URL externa."}
          </p>
          <ul id={listId} role="listbox" className="max-h-64 overflow-auto py-1">
            {suggestions.map((path, index) => (
              <li key={path} role="option" aria-selected={index === highlighted}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => select(path)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
                    index === highlighted ? "bg-zinc-100" : ""
                  }`}
                >
                  {/* Thumbnails are local files; the optimizer adds nothing here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={path}
                    alt=""
                    loading="lazy"
                    className="h-8 w-12 shrink-0 rounded border border-gray-200 object-cover"
                  />
                  <span className="truncate">{path}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
