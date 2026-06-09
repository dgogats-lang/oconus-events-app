"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormNavBar from "@/components/FormNavBar";
import { createTrip, updateTrip } from "@/actions/trip";

interface InitialValues {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface Props {
  tripId?: string;
  initialValues?: InitialValues;
  backHref: string;
}

export default function TripForm({ tripId, initialValues, backHref }: Props) {
  const router = useRouter();
  const isEdit = !!tripId;

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [startDate, setStartDate] = useState(initialValues?.startDate ?? "");
  const [endDate, setEndDate] = useState(initialValues?.endDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    if (!startDate)    { setError("Start date is required"); return; }
    if (!endDate)      { setError("End date is required"); return; }
    if (endDate < startDate) { setError("End date must be after start date"); return; }

    setSaving(true);
    setError(null);

    const result = isEdit
      ? await updateTrip(tripId!, { name, description, startDate, endDate })
      : await createTrip({ name, description, startDate, endDate });

    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Something went wrong");
      return;
    }

    if (isEdit) {
      router.push(`/trips/${tripId}`);
    } else if ("id" in result) {
      router.push(`/trips/${result.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormNavBar
        backHref={backHref}
        backLabel="Trips"
        title={isEdit ? "Edit Trip" : "New Trip"}
        isPending={saving}
      />

      <div className="px-4 pt-4 pb-24 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          {/* Name */}
          <div className="px-4 py-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
              Trip Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="HOH Europe Summits 2027"
              className="w-full text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
            />
          </div>

          {/* Description */}
          <div className="px-4 py-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Three-city summit tour"
              className="w-full text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          <div className="px-4 py-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-sm text-gray-900 bg-transparent outline-none"
            />
          </div>
          <div className="px-4 py-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-sm text-gray-900 bg-transparent outline-none"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
