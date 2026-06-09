"use client";

import { useState } from "react";
import { inviteMember } from "@/actions/trip";

interface Props {
  tripId: string;
}

export default function InviteMemberForm({ tripId }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleInvite() {
    if (!email.trim()) return;
    setState("saving");
    setErrorMsg("");

    const result = await inviteMember(tripId, email, role);

    if (result.success) {
      setState("success");
      setEmail("");
      setRole("STAFF");
      setTimeout(() => setState("idle"), 3000);
    } else {
      setState("error");
      setErrorMsg(result.error ?? "Something went wrong");
    }
  }

  return (
    <div className="space-y-3">
      {state === "success" && (
        <p className="text-xs text-green-600 font-medium">
          Invite sent — they'll receive a sign-in link.
        </p>
      )}
      {state === "error" && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}

      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="flex-1 text-sm bg-gray-50 rounded-xl px-3 py-2 outline-none border border-gray-200 focus:border-brand-navy placeholder:text-gray-300"
        />

        {/* Role toggle */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
          {(["STAFF", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-2 text-xs font-bold transition-colors ${
                role === r
                  ? "bg-brand-navy text-white"
                  : "bg-white text-gray-400"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleInvite}
        disabled={!email.trim() || state === "saving"}
        className="w-full bg-brand-navy text-white text-sm font-bold rounded-xl py-2.5 disabled:opacity-40 active:opacity-80 transition-opacity"
      >
        {state === "saving" ? "Sending…" : "Send Invite"}
      </button>
    </div>
  );
}
