import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import MovementForm from "../../MovementForm";

export default async function EditMovementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { id } = await params;

  const { getActiveTripId } = await import("@/lib/getActiveTrip");
  const tripId = await getActiveTripId(session.user.id);

  const [movement, events] = await Promise.all([
    db.movement.findUnique({
      where: { id },
      select: {
        id: true,
        eventId: true,
        timezone: true,
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
    tripId
      ? db.event.findMany({
          where: { tripId },
          orderBy: { date: "asc" },
          select: { id: true, name: true, city: true, timezone: true },
        })
      : Promise.resolve([]),
  ]);

  if (!movement) notFound();

  return (
    <MovementForm
      events={events}
      movementId={movement.id}
      backHref={`/movements/${movement.id}`}
      initialValues={{
        eventId:           movement.eventId,
        timezone:          movement.timezone ?? "UTC",
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
