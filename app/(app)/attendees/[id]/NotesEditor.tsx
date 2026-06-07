"use client";

import { useState, useTransition } from "react";
import { updateAttendeeNotes } from "@/actions/attendee";

export default function NotesEditor({
  attendeeId,
  initialNotes,
}: {
  attendeeId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateAttendeeNotes(attendeeId, notes);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(result.error ?? "Failed to save");
      }
    });
  };

  const isDirty = notes !== (initialNotes ?? "");

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        placeholder="Add notes about this attendee..."
        rows={4}
        className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#0C2340] placeholder:text-gray-400"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs">
          {saved && <span className="text-green-600">Saved</span>}
          {error && <span className="text-red-500">{error}</span>}
        </span>
        <button
          onClick={handleSave}
          disabled={!isDirty || isPending}
          className="text-xs font-semibold px-4 py-1.5 rounded-full bg-[#0C2340] text-white disabled:opacity-40 transition-opacity"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
