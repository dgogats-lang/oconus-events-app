"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getActiveTripId } from "@/lib/getActiveTrip";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  return user;
}

async function requireAdmin(tripId?: string) {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role === "SUPER_ADMIN") return user;
  if (!tripId) return null;
  const membership = await db.tripMembership.findUnique({
    where: { userId_tripId: { userId: user.id, tripId } },
  });
  if (membership?.role === "ADMIN") return user;
  return null;
}

// ─── Trip CRUD ────────────────────────────────────────────────────────────────

export async function createTrip(data: {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const user = await getSessionUser();
  // Only SUPER_ADMIN or ADMIN (any trip) can create trips
  if (!user) return { success: false, error: "Not authenticated" };
  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    return { success: false, error: "Admin only" };
  }

  try {
    const trip = await db.$transaction(async (tx) => {
      const t = await tx.trip.create({
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          startDate: new Date(data.startDate + "T00:00:00.000Z"),
          endDate: new Date(data.endDate + "T23:59:59.000Z"),
          isActive: true,
        },
      });
      // Creator gets ADMIN membership automatically
      if (user.role !== "SUPER_ADMIN") {
        await tx.tripMembership.create({
          data: { userId: user.id, tripId: t.id, role: "ADMIN" },
        });
      }
      // Also set as user's selected trip
      await tx.user.update({
        where: { id: user.id },
        data: { selectedTripId: t.id },
      });
      return t;
    });

    revalidatePath("/trips");
    revalidatePath("/more");
    return { success: true, id: trip.id };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to create trip" };
  }
}

export async function updateTrip(
  id: string,
  data: {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin(id);
  if (!admin) return { success: false, error: "Admin only" };

  try {
    await db.trip.update({
      where: { id },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        startDate: new Date(data.startDate + "T00:00:00.000Z"),
        endDate: new Date(data.endDate + "T23:59:59.000Z"),
      },
    });

    revalidatePath("/trips");
    revalidatePath(`/trips/${id}`);
    revalidatePath("/more");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to update trip" };
  }
}

// ─── Trip switching ───────────────────────────────────────────────────────────

export async function selectTrip(
  tripId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user) return { success: false, error: "User not found" };

  // SUPER_ADMIN can select any trip; others need membership
  if (user.role !== "SUPER_ADMIN") {
    const membership = await db.tripMembership.findUnique({
      where: { userId_tripId: { userId: session.user.id, tripId } },
    });
    if (!membership) return { success: false, error: "No access to this trip" };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { selectedTripId: tripId },
  });

  revalidatePath("/");
  return { success: true };
}

// ─── Member management ────────────────────────────────────────────────────────

export async function inviteMember(
  tripId: string,
  email: string,
  role: "ADMIN" | "STAFF"
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin(tripId);
  if (!admin) return { success: false, error: "Admin only" };

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Upsert the user (create if new)
    const member = await db.user.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail, role: "STAFF" },
      update: {},
    });

    // Upsert the membership (update role if already a member)
    await db.tripMembership.upsert({
      where: { userId_tripId: { userId: member.id, tripId } },
      create: { userId: member.id, tripId, role },
      update: { role },
    });

    // Send a magic link so the new user can sign in
    const { sendMagicLink } = await import("@/lib/sendMagicLink");
    await sendMagicLink(normalizedEmail);

    revalidatePath(`/trips/${tripId}`);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to invite member" };
  }
}

export async function removeMember(
  tripId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin(tripId);
  if (!admin) return { success: false, error: "Admin only" };

  // Prevent removing yourself if you're the only admin
  const adminCount = await db.tripMembership.count({
    where: { tripId, role: "ADMIN" },
  });
  const targetMembership = await db.tripMembership.findUnique({
    where: { userId_tripId: { userId, tripId } },
    select: { role: true },
  });
  if (targetMembership?.role === "ADMIN" && adminCount <= 1) {
    return { success: false, error: "Cannot remove the only admin" };
  }

  await db.tripMembership.delete({
    where: { userId_tripId: { userId, tripId } },
  });

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
