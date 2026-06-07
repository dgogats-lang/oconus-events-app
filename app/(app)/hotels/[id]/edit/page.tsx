import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import HotelForm from "../../HotelForm";

async function getHotelAndEvents(id: string) {
  const [hotel, trip] = await Promise.all([
    db.hotel.findUnique({
      where: { id },
      select: {
        id: true,
        eventId: true,
        name: true,
        address: true,
        phone: true,
        notes: true,
      },
    }),
    db.trip.findFirst({ where: { isActive: true } }),
  ]);

  if (!hotel || !trip) return null;

  const events = await db.event.findMany({
    where: { tripId: trip.id },
    select: { id: true, name: true, city: true },
    orderBy: { date: "asc" },
  });

  return { hotel, events };
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
      hotelId={id}
      initialValues={{
        eventId: data.hotel.eventId,
        name: data.hotel.name,
        address: data.hotel.address,
        phone: data.hotel.phone,
        notes: data.hotel.notes,
      }}
      backHref={`/hotels/${id}`}
    />
  );
}
