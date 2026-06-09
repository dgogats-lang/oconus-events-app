import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import TripForm from "../../TripForm";

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  const [trip, dbUser] = await Promise.all([
    db.trip.findUnique({ where: { id } }),
    db.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
  ]);

  if (!trip) notFound();

  const isSuperAdmin = dbUser?.role === "SUPER_ADMIN";
  const membership = isSuperAdmin
    ? null
    : await db.tripMembership.findUnique({
        where: { userId_tripId: { userId: session.user.id, tripId: id } },
      });

  if (!isSuperAdmin && membership?.role !== "ADMIN") redirect(`/trips/${id}`);

  const initialValues = {
    name: trip.name,
    description: trip.description ?? "",
    startDate: trip.startDate.toISOString().slice(0, 10),
    endDate: trip.endDate.toISOString().slice(0, 10),
  };

  return <TripForm tripId={id} initialValues={initialValues} backHref={`/trips/${id}`} />;
}
