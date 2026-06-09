import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import DetailNavBar from "@/components/DetailNavBar";
import RecordHeader from "@/components/RecordHeader";
import SectionCard from "@/components/SectionCard";
import { MovementMode } from "@prisma/client";

const MODE_ICON: Record<MovementMode, string> = {
  BUS:    "🚌",
  CAR:    "🚗",
  FLIGHT: "✈️",
  TRAIN:  "🚆",
  WALK:   "🚶",
  OTHER:  "🚐",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

async function getEventDetail(id: string) {
  return db.event.findUnique({
    where: { id },
    include: {
      trip: { select: { name: true } },
      eventRegistrations: {
        include: {
          attendee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              company: { select: { name: true } },
            },
          },
        },
        orderBy: [
          { attendee: { lastName: "asc" } },
        ],
      },
      hotels: {
        select: {
          id: true,
          name: true,
          _count: { select: { hotelManifestEntries: true } },
        },
      },
      movements: {
        orderBy: { departureTime: "asc" },
        select: {
          id: true,
          name: true,
          mode: true,
          departureTime: true,
          departureLocation: true,
          arrivalLocation: true,
          _count: { select: { movementManifestEntries: true } },
        },
      },
    },
  });
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return null;

  const { id } = await params;
  const event = await getEventDetail(id);
  if (!event) notFound();

  return (
    <div className="pb-24">
      <DetailNavBar backHref="/events" backLabel="Events" />

      <div className="px-4">
        <RecordHeader
          eyebrow={`${event.trip.name.toUpperCase()} · ${event.city.toUpperCase()}`}
          title={event.name}
        >
          <p className="text-sm text-gray-400 mt-1">{fmtDate(event.date)}</p>
        </RecordHeader>

        {/* Attendees */}
        <SectionCard
          title={`${event.eventRegistrations.length} Attendees`}
          action={
            <Link href={`/attendees?event=${event.id}`} className="text-xs text-white/60 underline underline-offset-2">
              View all
            </Link>
          }
        >
          {event.eventRegistrations.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-400">No attendees registered.</p>
          ) : (
            event.eventRegistrations.slice(0, 5).map(({ attendee }) => (
              <Link
                key={attendee.id}
                href={`/attendees/${attendee.id}`}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 active:bg-gray-50"
              >
                <div className="w-8 h-8 rounded-full bg-chip flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-brand-navy">
                    {attendee.firstName[0]}{attendee.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attendee.firstName} {attendee.lastName}
                  </p>
                  {attendee.company && (
                    <p className="text-xs text-gray-400 truncate">{attendee.company.name}</p>
                  )}
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))
          )}
          {event.eventRegistrations.length > 5 && (
            <Link
              href={`/attendees?event=${event.id}`}
              className="block px-4 py-3 text-sm text-brand-navy font-medium text-center"
            >
              +{event.eventRegistrations.length - 5} more
            </Link>
          )}
        </SectionCard>

        {/* Hotels */}
        <SectionCard
          title="Hotels"
          action={
            <Link href="/hotels" className="text-xs text-white/60 underline underline-offset-2">
              Manage
            </Link>
          }
        >
          {event.hotels.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-400">No hotels at this stop.</p>
          ) : (
            event.hotels.map((hotel) => (
              <Link
                key={hotel.id}
                href={`/hotels/${hotel.id}`}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 active:bg-gray-50"
              >
                <span className="text-lg">🏨</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{hotel.name}</p>
                  <p className="text-xs text-gray-400">{hotel._count.hotelManifestEntries} guests</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))
          )}
        </SectionCard>

        {/* Movements */}
        <SectionCard
          title="Movements"
          action={
            <Link href="/movements" className="text-xs text-white/60 underline underline-offset-2">
              Manage
            </Link>
          }
        >
          {event.movements.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-400">No movements at this stop.</p>
          ) : (
            event.movements.map((movement) => (
              <Link
                key={movement.id}
                href={`/movements/${movement.id}`}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 active:bg-gray-50"
              >
                <span className="text-lg">{MODE_ICON[movement.mode]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{movement.name}</p>
                  <p className="text-xs text-gray-400">
                    {fmtTime(movement.departureTime)} · {movement._count.movementManifestEntries} pax
                  </p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))
          )}
        </SectionCard>
      </div>
    </div>
  );
}
