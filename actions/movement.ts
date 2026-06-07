"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MovementEntryStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

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
