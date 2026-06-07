import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import HotelManifestClient from "./HotelManifestClient";

// ─── data fetching ────────────────────────────────────────────────────────────

async function getHotelData(id: string) {
  const hotel = await db.hotel.findUnique({
    where: { id },
    include: {
      event: { select: { id: true, name: true, city: true, tripId: true } },
      trip:  { select: { id: true, name: true } },
      hotelManifestEntries: {
        orderBy: [
          { attendee: { lastName: "asc" } },
          { attendee: { firstName: "asc" } },
        ],
        include: {
          attendee: {
            select: {
              id: true, firstName: true, lastName: true,
              email: true, phone: true,
              company: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!hotel) return null;

  const tripId = hotel.trip?.id ?? hotel.event?.tripId;
  if (!tripId) return null;

  const assignedIds = hotel.hotelManifestEntries.map((e) => e.attendeeId);

  if (hotel.eventId) {
    // Event hotel — assignable = attendees registered for this event, not already here
    const [assignable, travelPackageRegistered] = await Promise.all([
      db.attendee.findMany({
        where: {
          eventRegistrations: { some: { eventId: hotel.eventId } },
          id: { notIn: assignedIds },
        },
        select: {
          id: true, firstName: true, lastName: true,
          email: true, phone: true,
          company: { select: { name: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
      // Coverage gap: travel package attendees registered for this event with no hotel at this event
      db.attendee.findMany({
        where: {
          travelPackage: true,
          eventRegistrations: { some: { eventId: hotel.eventId } },
          hotelManifestEntries: {
            none: { hotel: { eventId: hotel.eventId } },
          },
        },
        select: {
          id: true, firstName: true, lastName: true,
          email: true, phone: true,
          company: { select: { name: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
    ]);
    return { hotel, tripId, assignableAttendees: assignable, coverageGap: travelPackageRegistered };
  } else {
    // Transit hotel — assignable = all trip attendees not already here
    const [assignable, travelPackageAll] = await Promise.all([
      db.attendee.findMany({
        where: {
          tripId,
          id: { notIn: assignedIds },
        },
        select: {
          id: true, firstName: true, lastName: true,
          email: true, phone: true,
          company: { select: { name: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
      // Coverage gap: all travel package attendees on trip with no assignment here
      db.attendee.findMany({
        where: {
          tripId,
          travelPackage: true,
          id: { notIn: assignedIds },
        },
        select: {
          id: true, firstName: true, lastName: true,
          email: true, phone: true,
          company: { select: { name: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
    ]);
    return { hotel, tripId, assignableAttendees: assignable, coverageGap: travelPackageAll };
  }
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth();
  const { id } = await params;

  const data = await getHotelData(id);
  if (!data) notFound();

  const { hotel } = data;

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
        <h1 className="text-xl font-bold text-gray-900 leading-snug">{hotel.name}</h1>

        {(hotel.address || hotel.phone) && (
          <div className="mt-3 space-y-1.5">
            {hotel.address && (
              <div className="flex items-start gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0 mt-0.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {hotel.googlePlaceId ? (
                  <a
                    href={`https://www.google.com/maps/place/?q=place_id:${hotel.googlePlaceId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600"
                  >
                    {hotel.address}
                  </a>
                ) : (
                  <p className="text-sm text-gray-600">{hotel.address}</p>
                )}
              </div>
            )}
            {hotel.phone && (
              <a href={`tel:${hotel.phone}`} className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.57 3.41 2 2 0 0 1 3.54 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span className="text-sm text-blue-600">{hotel.phone}</span>
              </a>
            )}
          </div>
        )}

        {hotel.notes && (
          <div className="mt-3 bg-amber-50 rounded-xl px-3 py-2.5">
            <p className="text-xs text-amber-800 leading-relaxed">{hotel.notes}</p>
          </div>
        )}
      </div>

      {/* Rooming list (client) */}
      <HotelManifestClient
        hotelId={hotel.id}
        entries={hotel.hotelManifestEntries}
        assignableAttendees={data.assignableAttendees}
        coverageGap={data.coverageGap}
      />
    </div>
  );
}
