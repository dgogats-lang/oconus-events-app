"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MovementEntryStatus, MovementMode } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createMovement(data: {
  eventId: string | null;
  timezone: string;
  name: string;
  mode: MovementMode;
  departureLocation: string;
  arrivalLocation: string;
  departureTime: string; // ISO string (UTC)
  arrivalTime?: string | null;
  meetTime?: string | null;
  meetLocation?: string | null;
  notes?: string | null;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Not authenticated" };
  try {
    // Derive tripId from the event when one is set
    let tripId: string | null = null;
    if (data.eventId) {
      const event = await db.event.findUnique({
        where: { id: data.eventId },
        select: { tripId: true },
      });
      tripId = event?.tripId ?? null;
    }
    if (!tripId) {
      // Fallback: use the active trip
      const trip = await db.trip.findFirst({ where: { isActive: true }, select: { id: true } });
      tripId = trip?.id ?? null;
    }

    const movement = await db.movement.create({
      data: {
        tripId,
        eventId: data.eventId,
        timezone: data.timezone,
        name: data.name.trim(),
        mode: data.mode,
        departureLocation: data.departureLocation.trim(),
        arrivalLocation: data.arrivalLocation.trim(),
        departureTime: new Date(data.departureTime),
        arrivalTime: data.arrivalTime ? new Date(data.arrivalTime) : null,
        meetTime: data.meetTime ? new Date(data.meetTime) : null,
        meetLocation: data.meetLocation?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });
    revalidatePath("/movements");
    return { success: true, id: movement.id };
  } catch {
    return { success: false, error: "Failed to create movement" };
  }
}

export async function updateMovement(
  id: string,
  data: {
    eventId: string | null;
    timezone: string;
    name: string;
    mode: MovementMode;
    departureLocation: string;
    arrivalLocation: string;
    departureTime: string;
    arrivalTime?: string | null;
    meetTime?: string | null;
    meetLocation?: string | null;
    notes?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Not authenticated" };
  try {
    // Re-derive tripId when event changes
    let tripId: string | null = null;
    if (data.eventId) {
      const event = await db.event.findUnique({
        where: { id: data.eventId },
        select: { tripId: true },
      });
      tripId = event?.tripId ?? null;
    }
    if (!tripId) {
      const trip = await db.trip.findFirst({ where: { isActive: true }, select: { id: true } });
      tripId = trip?.id ?? null;
    }

    await db.movement.update({
      where: { id },
      data: {
        tripId,
        eventId: data.eventId,
        timezone: data.timezone,
        name: data.name.trim(),
        mode: data.mode,
        departureLocation: data.departureLocation.trim(),
        arrivalLocation: data.arrivalLocation.trim(),
        departureTime: new Date(data.departureTime),
        arrivalTime: data.arrivalTime ? new Date(data.arrivalTime) : null,
        meetTime: data.meetTime ? new Date(data.meetTime) : null,
        meetLocation: data.meetLocation?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });
    revalidatePath(`/movements/${id}`);
    revalidatePath("/movements");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update movement" };
  }
}

export async function addToManifest(
  movementId: string,
  attendeeId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Not authenticated" };
  try {
    await db.movementManifestEntry.upsert({
      where: { movementId_attendeeId: { movementId, attendeeId } },
      create: { movementId, attendeeId, status: "PENDING" },
      update: { status: "PENDING", checkedInAt: null },
    });
    revalidatePath(`/movements/${movementId}`);
    revalidatePath("/movements");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to add to manifest" };
  }
}

export async function removeFromManifest(
  movementId: string,
  attendeeId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Not authenticated" };
  try {
    await db.movementManifestEntry.delete({
      where: { movementId_attendeeId: { movementId, attendeeId } },
    });
    revalidatePath(`/movements/${movementId}`);
    revalidatePath("/movements");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to remove from manifest" };
  }
}

export async function transferToMovement(
  fromMovementId: string,
  toMovementId: string,
  attendeeId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Not authenticated" };
  try {
    await db.$transaction([
      db.movementManifestEntry.delete({
        where: { movementId_attendeeId: { movementId: fromMovementId, attendeeId } },
      }),
      db.movementManifestEntry.upsert({
        where: { movementId_attendeeId: { movementId: toMovementId, attendeeId } },
        create: { movementId: toMovementId, attendeeId, status: "PENDING" },
        update: { status: "PENDING", checkedInAt: null },
      }),
    ]);
    revalidatePath(`/movements/${fromMovementId}`);
    revalidatePath(`/movements/${toMovementId}`);
    revalidatePath("/movements");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to transfer" };
  }
}

export async function updateManifestEntry(
  movementId: string,
  attendeeId: string,
  status: MovementEntryStatus
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await db.movementManifestEntry.update({
      where: {
        movementId_attendeeId: { movementId, attendeeId },
      },
      data: {
        status,
        checkedInAt: status === "CHECKED_IN" ? new Date() : null,
      },
    });

    revalidatePath(`/movements/${movementId}`);
    revalidatePath("/movements");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update check-in status" };
  }
}
