"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";

const ATTR_FILTERS = [
  { value: "dod", label: "Has DoD ID" },
  { value: "travel", label: "Travel Package" },
];

type EventOption = { id: string; name: string; city: string };

export default function AttendeeSearch({
  defaultSearch,
  defaultFilters,
  defaultEventId,
  events,
}: {
  defaultSearch: string;
  defaultFilters: string[];
  defaultEventId: string;
  events: EventOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushParams = useCallback(
    (q: string, filters: string[], eventId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      if (filters.length > 0) params.set("filter", filters.join(","));
      else params.delete("filter");
      if (eventId) params.set("eventId", eventId);
      else params.delete("eventId");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams(value, defaultFilters, defaultEventId);
    }, 300);
  };

  const handleAttrFilter = (value: string) => {
    const next = defaultFilters.includes(value)
      ? defaultFilters.filter((f) => f !== value)
      : [...defaultFilters, value];
    pushParams(defaultSearch, next, defaultEventId);
  };

  const handleEvent = (id: string) => {
    pushParams(defaultSearch, defaultFilters, id === defaultEventId ? "" : id);
  };

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          placeholder="Search by name..."
          defaultValue={defaultSearch}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340]"
        />
      </div>

      {/* Event filter chips — single select */}
      {events.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {events.map((ev) => {
            const active = defaultEventId === ev.id;
            return (
              <button
                key={ev.id}
                onClick={() => handleEvent(ev.id)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? "bg-[#0C2340] text-white border-[#0C2340]"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {ev.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Attribute filter chips — multi select */}
      <div className="flex gap-2 flex-wrap">
        {ATTR_FILTERS.map((f) => {
          const active = defaultFilters.includes(f.value);
          return (
            <button
              key={f.value}
              onClick={() => handleAttrFilter(f.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? "bg-[#0C2340] text-white border-[#0C2340]"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
