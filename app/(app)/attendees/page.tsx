import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import AttendeeSearch from "./AttendeeSearch";
import PageHeader from "@/components/PageHeader";

// ─── data fetching ────────────────────────────────────────────────────────────

async function getAttendeesData(
  userId: string,
  search: string,
  filters: string[],
  eventId: string
) {
  const { getActiveTripId } = await import("@/lib/getActiveTrip");
  const tripId = await getActiveTripId(userId);
  if (!tripId) return { trip: null, currentEvent: null, events: [], attendees: [] };
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: { events: { orderBy: { date: "asc" } } },
  });

  if (!trip) return { trip: null, currentEvent: null, events: [], attendees: [] };

  // Current event: prefer today, else next upcoming, else most recent past
  const now = new Date();
  const todayStr = now.toDateString();
  const currentEvent =
    trip.events.find((e) => new Date(e.date).toDateString() === todayStr) ??
    trip.events.find((e) => e.date > now) ??
    trip.events[trip.events.length - 1] ??
    null;

  const attendees = await db.attendee.findMany({
    where: {
      tripId: trip.id,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters.includes("dod") ? { hasDodId: true } : {}),
      ...(filters.includes("travel") ? { travelPackage: true } : {}),
      ...(eventId
        ? { eventRegistrations: { some: { eventId } } }
        : {}),
    },
    include: {
      company: { select: { name: true } },
      hotelManifestEntries: {
        where: currentEvent ? { hotel: { eventId: currentEvent.id } } : { id: "" },
        include: { hotel: { select: { name: true } } },
        take: 1,
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return { trip, currentEvent, events: trip.events, attendees };
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AttendeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; eventId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { q, filter, eventId } = await searchParams;
  const search = q ?? "";
  const activeFilters = (filter ?? "").split(",").filter(Boolean);
  const activeEventId = eventId ?? "";

  const { trip, currentEvent, events, attendees } = await getAttendeesData(
    session.user.id,
    search,
    activeFilters,
    activeEventId
  );

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <PageHeader
        eyebrow={trip?.name}
        title="Attendees"
        action={
          <span className="bg-[#0C2340] text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {attendees.length}
          </span>
        }
      />

      {/* Search + filter */}
      <AttendeeSearch
        defaultSearch={search}
        defaultFilters={activeFilters}
        defaultEventId={activeEventId}
        events={events.map((e) => ({ id: e.id, name: e.name, city: e.city }))}
      />

      {/* List */}
      {!trip ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center mt-4">
          <p className="text-gray-400 text-sm">No active trip</p>
        </div>
      ) : attendees.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm mt-3">
          <div className="px-4 py-10 text-center">
            <p className="text-gray-400 text-sm">
              {search ? `No results for "${search}"` : "No attendees loaded yet."}
            </p>
            {!search && (
              <p className="text-gray-300 text-xs mt-1">
                Run the import script to load data.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 mt-3">
          {attendees.map((attendee) => {
            const hotel = attendee.hotelManifestEntries?.[0]?.hotel;
            return (
              <Link
                key={attendee.id}
                href={`/attendees/${attendee.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 first:rounded-t-2xl last:rounded-b-2xl"
              >
                {/* Initials avatar */}
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-[#0C2340]">
                    {attendee.firstName[0]}
                    {attendee.lastName[0]}
                  </span>
                </div>

                {/* Name + meta */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {attendee.lastName}, {attendee.firstName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {attendee.company?.name ?? "—"}
                    {hotel ? ` · ${hotel.name}` : ""}
                  </p>
                </div>

                {/* Badges + chevron */}
                <div className="flex items-center gap-1 shrink-0">
                  {attendee.hasDodId && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                      DoD
                    </span>
                  )}
                  {attendee.travelPackage && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-50 text-green-700">
                      PKG
                    </span>
                  )}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#D1D5DB"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-1"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {attendees.length > 0 && (
        <p className="text-center text-xs text-gray-400 mt-3">
          {attendees.length} attendee{attendees.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
