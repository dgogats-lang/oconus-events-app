"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "dod", label: "Has DoD ID" },
  { value: "travel", label: "Travel Package" },
];

type EventOption = { id: string; name: string; city: string };

export default function AttendeeSearch({
  defaultSearch,
  defaultFilter,
  defaultEventId,
  events,
}: {
  defaultSearch: string;
  defaultFilter: string;
  defaultEventId: string;
  events: EventOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushParams = useCallback(
    (q: string, filter: string, eventId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      if (filter && filter !== "all") params.set("filter", filter);
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
      pushParams(value, defaultFilter, defaultEventId);
    }, 300);
  };

  const handleFilter = (value: string) => {
    pushParams(defaultSearch, value, defaultEventId);
  };

  const handleEvent = (id: string) => {
    // Toggle: tapping the active event clears it
    pushParams(defaultSearch, defaultFilter, id === defaultEventId ? "" : id);
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

      {/* Attribute filter chips */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilter(f.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              defaultFilter === f.value
                ? "bg-[#0C2340] text-white border-[#0C2340]"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Event filter chips */}
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
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {ev.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
