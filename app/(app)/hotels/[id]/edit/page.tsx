import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import HotelForm from "../../HotelForm";

async function getHotelAndEvents(id: string) {
  const hotel = await db.hotel.findUnique({
    where: { id },
    select: { id: true, eventId: true, tripId: true, name: true, address: true, googlePlaceId: true, phone: true, notes: true },
  });
  if (!hotel) return null;

  const tripId = hotel.tripId ?? (
    hotel.eventId
      ? (await db.event.findUnique({ where: { id: hotel.eventId }, select: { tripId: true } }))?.tripId
      : null
  );
  if (!tripId) return null;

  const events = await db.event.findMany({
    where: { tripId },
    select: { id: true, name: true, city: true },
    orderBy: { date: "asc" },
  });

  return { hotel, tripId, events };
}

export default async function EditHotelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth();
  const { id } = await params;
  const data = await getHotelAndEvents(id);
  if (!data) notFound();

  return (
    <HotelForm
        events={data.events}
        tripId={data.tripId}
        hotelId={id}
        initialValues={{
          eventId:       data.hotel.eventId,
          tripId:        data.tripId,
          name:          data.hotel.name,
          address:       data.hotel.address,
          googlePlaceId: data.hotel.googlePlaceId,
          phone:         data.hotel.phone,
          notes:         data.hotel.notes,
        }}
        backHref={`/hotels/${id}`}
      />
  );
}
