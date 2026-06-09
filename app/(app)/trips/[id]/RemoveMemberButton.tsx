"use client";

import { useState, useTransition } from "react";
import { removeMember } from "@/actions/trip";

interface Props {
  tripId: string;
  userId: string;
}

export default function RemoveMemberButton({ tripId, userId }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  function handlePress() {
    if (!confirmed) {
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 3000);
      return;
    }
    startTransition(async () => {
      await removeMember(tripId, userId);
      setConfirmed(false);
    });
  }

  return (
    <button
      onClick={handlePress}
      disabled={pending}
      className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 transition-colors ${
        confirmed
          ? "bg-red-100 text-red-600"
          : "bg-gray-100 text-gray-400 active:bg-gray-200"
      }`}
    >
      {pending ? "…" : confirmed ? "Confirm" : "Remove"}
    </button>
  );
}
