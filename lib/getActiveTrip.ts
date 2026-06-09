import { db } from "@/lib/db";

/**
 * Returns the ID of the trip the user should currently see.
 *
 * Resolution order:
 *   1. user.selectedTripId — if set and accessible
 *   2. Most recent trip the user is a member of (or any trip for SUPER_ADMIN)
 *
 * SUPER_ADMIN bypasses all membership checks.
 */
export async function getActiveTripId(userId: string): Promise<string | null> {
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, selectedTripId: true },
  });
  if (!user) return null;

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  // Try selectedTripId first
  if (user.selectedTripId) {
    if (isSuperAdmin) return user.selectedTripId;
    const membership = await db.tripMembership.findUnique({
      where: { userId_tripId: { userId, tripId: user.selectedTripId } },
    });
    if (membership) return user.selectedTripId;
    // selectedTripId stale (membership removed) — fall through
  }

  // Fall back to most recent accessible trip
  if (isSuperAdmin) {
    const trip = await db.trip.findFirst({ orderBy: { startDate: "desc" } });
    return trip?.id ?? null;
  }

  const membership = await db.tripMembership.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { tripId: true },
  });
  return membership?.tripId ?? null;
}

/**
 * Returns all trips accessible to the user, for the trip switcher.
 * SUPER_ADMIN sees every trip.
 */
export async function getAccessibleTrips(userId: string) {
  if (!userId) return [];

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return [];

  if (user.role === "SUPER_ADMIN") {
    return db.trip.findMany({ orderBy: { startDate: "desc" } });
  }

  const memberships = await db.tripMembership.findMany({
    where: { userId },
    include: { trip: true },
    orderBy: { createdAt: "desc" },
  });
  return memberships.map((m) => m.trip);
}

/**
 * Returns the user's per-trip role. SUPER_ADMIN always returns "ADMIN".
 */
export async function getTripRole(
  userId: string,
  tripId: string
): Promise<"ADMIN" | "STAFF" | null> {
  if (!userId || !tripId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return null;
  if (user.role === "SUPER_ADMIN") return "ADMIN";

  const membership = await db.tripMembership.findUnique({
    where: { userId_tripId: { userId, tripId } },
    select: { role: true },
  });
  return membership?.role ?? null;
}
