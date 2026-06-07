import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MovementMode } from "@prisma/client";
import ManifestClient from "./ManifestClient";

// ─── helpers ──────────────────────────────────────────────────────────────────

const MODE_LABEL: Record<MovementMode, string> = {
  BUS:    "Bus",
  CAR:    "Car",
  FLIGHT: "Flight",
  TRAIN:  "Train",
  WALK:   "Walk",
  OTHER:  "Transfer",
};

function fmtTime(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtDayTime(d: Date) {
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── data fetching ────────────────────────────────────────────────────────────

async function getMovement(id: string) {
  const movement = await db.movement.findUnique({
    where: { id },
    include: {
      event: { select: { id: true, name: true, city: true, tripId: true } },
      movementManifestEntries: {
        orderBy: [
          { attendee: { lastName: "asc" } },
          { attendee: { firstName: "asc" } },
        ],
        include: {
          attendee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              company: { select: { name: true } },
              hotelManifestEntries: {
                // Hotel for this specific event stop
                where: { eventId: id }, // will be replaced below
                include: { hotel: { select: { name: true } } },
                take: 1,
              },
            },
          },
        },
      },
    },
  });
  return movement;
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function MovementManifestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth();
  const { id } = await params;

  // Fetch movement first to get eventId, then re-query with correct hotel filter
  const movementRaw = await db.movement.findUnique({
    where: { id },
    select: { eventId: true },
  });
  if (!movementRaw) notFound();

  const movement = await db.movement.findUnique({
    where: { id },
    include: {
      event: { select: { id: true, name: true, city: true, tripId: true } },
      movementManifestEntries: {
        orderBy: [
          { attendee: { lastName: "asc" } },
          { attendee: { firstName: "asc" } },
        ],
        include: {
          attendee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              company: { select: { name: true } },
              hotelManifestEntries: {
                where: { eventId: movementRaw.eventId },
                include: { hotel: { select: { name: true } } },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!movement) notFound();

  // Fetch trip attendees (for add flow) + other movements for same event (for transfer)
  const [tripAttendees, otherMovements] = await Promise.all([
    db.attendee.findMany({
      where: { tripId: movement.event.tripId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        company: { select: { name: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.movement.findMany({
      where: { eventId: movement.event.id, id: { not: movement.id } },
      select: { id: true, name: true, departureTime: true },
      orderBy: { departureTime: "asc" },
    }),
  ]);

  return (
    <div className="pb-24">
      {/* Back nav */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <Link
          href="/movements"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#0C2340] bg-[#E8EDF2] rounded-full px-3 py-1.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Movements
        </Link>
        <Link
          href={`/movements/${movement.id}/edit`}
          aria-label="Edit movement"
          className="inline-flex items-center justify-center w-[34px] h-[34px] text-[#0C2340] bg-[#E8EDF2] rounded-full"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </Link>
      </div>

      {/* Header */}
      <div className="px-4 pt-4 pb-5">
        <p className="text-xs text-gray-400 mb-1">
          {movement.event.name} · {movement.event.city}
        </p>
        <h1 className="text-xl font-bold text-gray-900 leading-snug">
          {movement.name}
        </h1>

        {/* Mode + time */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {MODE_LABEL[movement.mode]}
          </span>
          <span className="text-xs text-gray-500">
            {fmtDayTime(movement.departureTime)}
            {movement.arrivalTime ? ` → ${fmtTime(movement.arrivalTime)}` : ""}
          </span>
        </div>

        {/* Route */}
        <div className="mt-3 flex items-start gap-2">
          <div className="flex flex-col items-center shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full border-2 border-[#0C2340]" />
            <div className="w-px h-5 bg-gray-200 my-0.5" />
            <div className="w-2 h-2 rounded-full bg-[#0C2340]" />
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-none">
              {movement.departureLocation}
            </p>
            <p className="text-sm text-gray-700 leading-none">
              {movement.arrivalLocation}
            </p>
          </div>
        </div>

        {/* Notes */}
        {movement.notes && (
          <div className="mt-3 bg-amber-50 rounded-xl px-3 py-2.5">
            <p className="text-xs text-amber-800 leading-relaxed">
              {movement.notes}
            </p>
          </div>
        )}
      </div>

      {/* Manifest */}
      <div className="px-4">
        <ManifestClient
          movementId={movement.id}
          entries={movement.movementManifestEntries}
          tripAttendees={tripAttendees}
          otherMovements={otherMovements}
        />
      </div>
    </div>
  );
}
