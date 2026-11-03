import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Generates a unique reference number in the format AMC-YYYYMMDD-XXXX (FR-20, BR-01).
 * XXXX is a 4-character alphanumeric sequence with collision detection and retry logic.
 */
export async function generateRepairReference(): Promise<string> {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const datePart = `${yyyy}${mm}${dd}`;

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let attempt = 0; attempt < 10; attempt++) {
    let randomPart = "";
    const randomBytes = crypto.randomBytes(4);
    for (let i = 0; i < 4; i++) {
      randomPart += chars[randomBytes[i] % chars.length];
    }

    const referenceNumber = `AMC-${datePart}-${randomPart}`;

    const existing = await prisma.repairOrder.findUnique({
      where: { referenceNumber },
      select: { id: true },
    });

    if (!existing) {
      return referenceNumber;
    }
  }

  // Fallback with hex suffix
  const hex = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `AMC-${datePart}-${hex}`;
}

/**
 * Generates a unique receipt number in the format RCP-YYYYMMDD-XXXX (FR-52, BR-11).
 * XXXX is a 4-character alphanumeric sequence with collision detection and retry logic.
 */
export async function generateReceiptNumber(): Promise<string> {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const datePart = `${yyyy}${mm}${dd}`;

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let attempt = 0; attempt < 10; attempt++) {
    let randomPart = "";
    const randomBytes = crypto.randomBytes(4);
    for (let i = 0; i < 4; i++) {
      randomPart += chars[randomBytes[i] % chars.length];
    }

    const receiptNumber = `RCP-${datePart}-${randomPart}`;

    const existing = await prisma.payment.findUnique({
      where: { receiptNumber },
      select: { id: true },
    });

    if (!existing) {
      return receiptNumber;
    }
  }

  // Fallback with hex suffix
  const hex = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `RCP-${datePart}-${hex}`;
}

