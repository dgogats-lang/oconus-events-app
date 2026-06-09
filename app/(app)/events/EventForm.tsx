"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEvent, updateEvent } from "@/actions/event";
import FormNavBar from "@/components/FormNavBar";

interface InitialValues {
  name: string;
  city: string;
  country: string;
  date: string;   // YYYY-MM-DD
  timezone: string;
}

interface EventFormProps {
  initialValues?: InitialValues;
  eventId?: string;
  backHref: string;
}

// Common IANA timezones for ops use — extend as needed
const TIMEZONES = [
  { label: "UTC", value: "UTC" },
  { label: "London (GMT/BST)", value: "Europe/London" },
  { label: "Paris / Berlin / Warsaw (CET/CEST)", value: "Europe/Berlin" },
  { label: "Helsinki / Kyiv (EET/EEST)", value: "Europe/Helsinki" },
  { label: "Dubai (GST)", value: "Asia/Dubai" },
  { label: "Tokyo (JST)", value: "Asia/Tokyo" },
  { label: "New York (ET)", value: "America/New_York" },
  { label: "Chicago (CT)", value: "America/Chicago" },
  { label: "Denver (MT)", value: "America/Denver" },
  { label: "Los Angeles (PT)", value: "America/Los_Angeles" },
];

export default function EventForm({ initialValues, eventId, backHref }: EventFormProps) {
  const router = useRouter();
  const isEdit = !!eventId;
  const [isPending, startTransition] = useTransition();

  const [name, setName]         = useState(initialValues?.name ?? "");
  const [city, setCity]         = useState(initialValues?.city ?? "");
  const [country, setCountry]   = useState(initialValues?.country ?? "");
  const [date, setDate]         = useState(initialValues?.date ?? "");
  const [timezone, setTimezone] = useState(initialValues?.timezone ?? "Europe/Berlin");
  const [error, setError]       = useState<string | null>(null);

  const canSave = name.trim() && city.trim() && country.trim() && date;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setError(null);
    startTransition(async () => {
      const data = { name, city, country, date, timezone };
      const result = isEdit
        ? await updateEvent(eventId!, data)
        : await createEvent(data);

      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      router.push(isEdit ? `/events/${eventId}` : "/events");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="pb-24">
      <FormNavBar
        title={isEdit ? "Edit Event" : "New Event"}
        backHref={backHref}
        backLabel={isEdit ? "Event" : "Events"}
        isPending={isPending}
      />

      <div className="px-4 pt-2 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Event Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Munich Summit"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
          />
        </div>

        {/* City + Country */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Munich"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Country
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Germany"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
          />
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>
    </form>
  );
}
