import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

// ─── data fetching ────────────────────────────────────────────────────────────

async function getHotel(id: string) {
  return db.hotel.findUnique({
    where: { id },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          city: true,
          date: true,
          tripId: true,
        },
      },
      hotelManifestEntries: {
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
            },
          },
        },
      },
    },
  });
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth();
  const { id } = await params;

  const hotel = await getHotel(id);
  if (!hotel) notFound();

  const entries = hotel.hotelManifestEntries;

  return (
    <div className="pb-24">
      {/* Back nav */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <Link
          href="/hotels"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#0C2340] bg-[#E8EDF2] rounded-full px-3 py-1.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Hotels
        </Link>
        <Link
          href={`/hotels/${hotel.id}/edit`}
          aria-label="Edit hotel"
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
          {hotel.event ? `${hotel.event.name} · ${hotel.event.city}` : "Transit"}
        </p>
        <h1 className="text-xl font-bold text-gray-900 leading-snug">
          {hotel.name}
        </h1>

        {/* Contact info */}
        {(hotel.address || hotel.phone) && (
          <div className="mt-3 space-y-1.5">
            {hotel.address && (
              <div className="flex items-start gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0 mt-0.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <p className="text-sm text-gray-600">{hotel.address}</p>
              </div>
            )}
            {hotel.phone && (
              <a
                href={`tel:${hotel.phone}`}
                className="flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.57 3.41 2 2 0 0 1 3.54 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span className="text-sm text-blue-600">{hotel.phone}</span>
              </a>
            )}
          </div>
        )}

        {/* Notes */}
        {hotel.notes && (
          <div className="mt-3 bg-amber-50 rounded-xl px-3 py-2.5">
            <p className="text-xs text-amber-800 leading-relaxed">{hotel.notes}</p>
          </div>
        )}

        {/* Guest count pill */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
            {entries.length} {entries.length === 1 ? "guest" : "guests"}
          </span>
        </div>
      </div>

      {/* Rooming list */}
      <div className="px-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Rooming List
        </p>

        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm px-4 py-8 text-center">
            <p className="text-gray-400 text-sm">No guests assigned yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {entries.map((entry) => {
              const { attendee } = entry;
              const fullName = `${attendee.firstName} ${attendee.lastName}`;
              const hasDateInfo = entry.checkIn || entry.checkOut;

              return (
                <Link
                  key={entry.id}
                  href={`/attendees/${attendee.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-[#0C2340] flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-white">
                      {initials(attendee.firstName, attendee.lastName)}
                    </span>
                  </div>

                  {/* Name + company */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fullName}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {attendee.company?.name ?? ""}
                      {attendee.company?.name && hasDateInfo ? " · " : ""}
                      {hasDateInfo
                        ? `${fmtDate(entry.checkIn)} – ${fmtDate(entry.checkOut)}`
                        : ""}
                    </p>
                  </div>

                  {/* Room number + chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.roomNumber ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        Rm {entry.roomNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">No room</span>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes per entry (if any have notes) */}
      {entries.some((e) => e.notes) && (
        <div className="px-4 mt-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Room Notes
          </p>
          <div className="space-y-2">
            {entries
              .filter((e) => e.notes)
              .map((entry) => (
                <div key={entry.id} className="bg-white rounded-xl shadow-sm px-4 py-3">
                  <p className="text-xs font-medium text-gray-700">
                    {entry.attendee.firstName} {entry.attendee.lastName}
                    {entry.roomNumber ? ` · Rm ${entry.roomNumber}` : ""}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{entry.notes}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
