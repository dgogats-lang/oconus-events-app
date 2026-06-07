import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import MovementForm from "../../MovementForm";

export default async function EditMovementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth();
  const { id } = await params;

  const [movement, trip] = await Promise.all([
    db.movement.findUnique({
      where: { id },
      select: {
        id: true,
        eventId: true,
        name: true,
        mode: true,
        departureLocation: true,
        arrivalLocation: true,
        departureTime: true,
        arrivalTime: true,
        meetTime: true,
        meetLocation: true,
        notes: true,
      },
    }),
    db.trip.findFirst({
      where: { isActive: true },
      include: {
        events: {
          orderBy: { date: "asc" },
          select: { id: true, name: true, city: true },
        },
      },
    }),
  ]);

  if (!movement || !trip) notFound();

  return (
    <MovementForm
      events={trip.events}
      movementId={movement.id}
      backHref={`/movements/${movement.id}`}
      initialValues={{
        eventId:           movement.eventId,
        name:              movement.name,
        mode:              movement.mode,
        departureLocation: movement.departureLocation,
        arrivalLocation:   movement.arrivalLocation,
        departureTime:     movement.departureTime.toISOString(),
        arrivalTime:       movement.arrivalTime?.toISOString() ?? null,
        meetTime:          movement.meetTime?.toISOString() ?? null,
        meetLocation:      movement.meetLocation,
        notes:             movement.notes,
      }}
    />
  );
}
