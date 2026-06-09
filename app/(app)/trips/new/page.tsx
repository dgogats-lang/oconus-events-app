import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import TripForm from "../TripForm";

export default async function NewTripPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // Only ADMIN or SUPER_ADMIN can create trips
  if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") redirect("/trips");

  return <TripForm backHref="/trips" />;
}
