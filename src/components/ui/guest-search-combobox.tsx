"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface GuestSearchComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  eventId?: string;
}

// Helper function to extract guest name from formatted display name
// e.g. "Hannah Montana (•••• 1234)" -> "Hannah Montana"
function extractGuestNameFromSuggestion(suggestion: string): string {
  // Remove phone number part if it exists
  const phonePattern = /\s*\([•\s\d]+\)\s*$/;
  return suggestion.replace(phonePattern, "").trim();
}

export function GuestSearchCombobox({
  value,
  onValueChange,
  onSelect,
  disabled = false,
  placeholder = "Search guests...",
  className,
  eventId,
}: GuestSearchComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  console.log(
    "🔍 GuestSearchCombobox render - value:",
    value,
    "open:",
    open,
    "suggestions:",
    suggestions.length
  );

  const fetchSuggestions = React.useCallback(
    async (query: string) => {
      if (query.length < 2) {
        console.log("🔍 Query too short, clearing suggestions");
        setSuggestions([]);
        setOpen(false);
        setSelectedIndex(-1);
        return;
      }

      try {
        setLoading(true);
        console.log("🔍 Fetching suggestions for:", query);

        const apiUrl = eventId
          ? `/api/public/find-guest?eventId=${eventId}&name=${encodeURIComponent(
              query
            )}&autocomplete=true`
          : `/api/find-guest?name=${encodeURIComponent(
              query
            )}&autocomplete=true`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        console.log("🔍 API Response:", data);

        if (data.success && data.suggestions) {
          setSuggestions(data.suggestions);
          setOpen(data.suggestions.length > 0);
          setSelectedIndex(-1);
          console.log("✅ Suggestions updated:", data.suggestions);
        } else {
          setSuggestions([]);
          setOpen(false);
          setSelectedIndex(-1);
          console.log("❌ No suggestions received");
        }
      } catch (error) {
        console.error("❌ Error fetching suggestions:", error);
        setSuggestions([]);
        setOpen(false);
        setSelectedIndex(-1);
      } finally {
        setLoading(false);
      }
    },
    [eventId]
  );

  const handleInputChange = React.useCallback(
    (inputValue: string) => {
      console.log("📝 Input change:", inputValue);
      onValueChange(inputValue);
      setSelectedIndex(-1);

      // Clear existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce API call
      debounceRef.current = setTimeout(() => {
        console.log("⏰ Debounced fetch for:", inputValue);
        fetchSuggestions(inputValue);
      }, 300);
    },
    [onValueChange, fetchSuggestions]
  );

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      console.log("🎯 User selected suggestion:", selectedValue);

      // Extract the actual guest name from the formatted suggestion
      const guestName = extractGuestNameFromSuggestion(selectedValue);
      console.log("🔧 Extracted guest name:", guestName);

      // Call onSelect with the clean guest name for search
      onSelect(guestName);

      // Update the input value to show the clean name
      onValueChange(guestName);

      setOpen(false);
      setSuggestions([]);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    },
    [onSelect, onValueChange]
  );

  const handleInputFocus = React.useCallback(() => {
    if (suggestions.length > 0 && value.length >= 2) {
      setOpen(true);
    }
  }, [suggestions, value]);

  const handleInputBlur = React.useCallback(() => {
    // Delay closing to allow for suggestion clicks
    setTimeout(() => {
      setOpen(false);
      setSelectedIndex(-1);
    }, 150);
  }, []);

  const handleClear = React.useCallback(() => {
    onValueChange("");
    setSuggestions([]);
    setOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, [onValueChange]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        return;
      }

      if (!open || suggestions.length === 0) {
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          // Select the highlighted suggestion
          handleSelect(suggestions[selectedIndex]);
        } else if (suggestions.length > 0) {
          // Select the first suggestion if none is highlighted
          handleSelect(suggestions[0]);
        }
      }
    },
    [open, suggestions, selectedIndex, handleSelect]
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <Search className="h-4 w-4 text-gray-400" />
            </div>

            <Input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "pl-10 pr-12 h-12 text-base border-2 border-gray-200 hover:border-purple-300 focus:border-purple-400 transition-all duration-300 bg-white/95 backdrop-blur-sm shadow-inner focus:shadow-lg font-medium placeholder:text-gray-400 rounded-xl",
                loading && "cursor-wait",
                className
              )}
            />

            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {loading && (
                <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
              )}

              {value && !loading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  tabIndex={-1}
                >
                  <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                </button>
              )}

              <ChevronsUpDown className="h-4 w-4 text-gray-400 opacity-50" />
            </div>

            {/* Gradient border effect on focus */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-xl"
          style={{
            zIndex: 9999,
            width: containerRef.current?.offsetWidth || "auto",
          }}
          align="start"
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command
            shouldFilter={false}
            className="rounded-xl border border-purple-100"
          >
            <CommandList className="max-h-64">
              {loading && (
                <div className="p-6 text-center">
                  <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500 font-medium">
                    Searching guest list...
                  </p>
                </div>
              )}

              {!loading && suggestions.length === 0 && value.length >= 2 && (
                <CommandEmpty className="py-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Search className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-600 mb-1">
                        No guests found
                      </p>
                      <p className="text-sm text-gray-500">
                        Try a different name or spelling
                      </p>
                    </div>
                  </div>
                </CommandEmpty>
              )}

              {!loading && suggestions.length > 0 && (
                <CommandGroup className="p-1">
                  <div className="px-3 py-2 mb-1">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
                      Guest Suggestions ({suggestions.length})
                    </p>
                  </div>

                  {suggestions.map((suggestion, index) => {
                    console.log("🎨 Rendering suggestion:", suggestion);
                    const guestName =
                      extractGuestNameFromSuggestion(suggestion);
                    const isSelected = index === selectedIndex;
                    return (
                      <CommandItem
                        key={`${suggestion}-${index}`}
                        value={suggestion}
                        onSelect={() => handleSelect(suggestion)}
                        className={cn(
                          "cursor-pointer mx-1 p-3 rounded-lg border transition-all duration-200 group",
                          isSelected
                            ? "border-purple-300 bg-gradient-to-r from-purple-100 to-pink-100"
                            : "border-transparent hover:border-purple-200/50 hover:bg-gradient-to-r hover:from-purple-50/80 hover:to-pink-50/80"
                        )}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div
                            className={cn(
                              "w-8 h-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center transition-transform duration-200 flex-shrink-0",
                              isSelected ? "scale-110" : "group-hover:scale-110"
                            )}
                          >
                            <Search className="h-4 w-4 text-purple-600" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "font-semibold transition-colors duration-200 truncate",
                                isSelected
                                  ? "text-purple-700"
                                  : "text-gray-800 group-hover:text-purple-700"
                              )}
                            >
                              {suggestion}
                            </p>
                          </div>

                          <Check
                            className={cn(
                              "h-4 w-4 text-purple-600 transition-opacity duration-200 flex-shrink-0",
                              value === guestName
                                ? "opacity-100"
                                : isSelected
                                ? "opacity-75"
                                : "opacity-0 group-hover:opacity-50"
                            )}
                          />
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>

            {/* Enhanced scroll indicator */}
            {suggestions.length > 5 && (
              <div className="px-4 py-2 text-xs text-purple-600 bg-purple-50/80 border-t border-purple-100 text-center font-medium rounded-b-xl">
                ↕ Scroll to see more • Press ↑↓ to navigate • Enter to select
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
