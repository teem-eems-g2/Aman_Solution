import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/rbac";
import { verifyOrderAccess } from "@/lib/order-access";
import { Role, UserStatus } from "@prisma/client";

const consumePartSchema = z.object({
  partId: z.string().min(1, "Part ID is required"),
  quantityUsed: z.number().int().min(1, "Quantity used must be at least 1"),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;

    const order = await prisma.repairOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Resource not found or access denied" }, { status: 404 });
    }

    const access = verifyOrderAccess(order, user);
    if (!access.allowed) {
      return access.errorResponse!;
    }

    const parts = await prisma.repairPart.findMany({
      where: { repairOrderId: id },
      include: {
        part: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ parts });
  } catch (error) {
    console.error("GET /api/repair-orders/[id]/parts error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching repair parts" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireRole([Role.TECHNICIAN, Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = consumePartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const order = await prisma.repairOrder.findUnique({
      where: { id },
      include: {
        device: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Repair order not found" }, { status: 404 });
    }

    // BR-04: Assigned technician or Admin
    const access = verifyOrderAccess(order, user, { requireWrite: true });
    if (!access.allowed) {
      return access.errorResponse!;
    }

    const { partId, quantityUsed } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch InventoryPart
      const part = await tx.inventoryPart.findUnique({
        where: { id: partId },
      });

      if (!part) {
        return { error: "Inventory part not found", status: 404 };
      }

      // 2. Validate stock availability (FR-45)
      if (part.quantity < quantityUsed) {
        return { error: "Insufficient stock available", status: 400 };
      }

      // 3. Atomically decrement stock
      const updatedPart = await tx.inventoryPart.update({
        where: { id: partId },
        data: {
          quantity: {
            decrement: quantityUsed,
          },
        },
      });

      // 4. Create RepairPart snapshot record (FR-44)
      const repairPart = await tx.repairPart.create({
        data: {
          repairOrderId: id,
          partId,
          quantityUsed,
          recordedUnitCost: part.unitCost,
        },
        include: {
          part: true,
        },
      });

      // 5. Low-stock alert threshold check (FR-46)
      const isLowStock = updatedPart.quantity <= updatedPart.reorderThreshold;
      if (isLowStock) {
        const admins = await tx.user.findMany({
          where: { role: Role.ADMIN, status: UserStatus.ACTIVE },
          select: { id: true },
        });

        for (const admin of admins) {
          await tx.notification.create({
            data: {
              recipientId: admin.id,
              eventType: "LOW_STOCK_ALERT",
              message: `Low stock alert: Part "${part.name}" (SKU: ${part.sku}) is at or below reorder threshold (${updatedPart.quantity}/${part.reorderThreshold}).`,
              deliveryStatus: "DELIVERED",
            },
          });
        }
      }

      // 6. Record AuditLog (BR-13)
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "REPAIR_PART_CONSUMED",
          entityType: "RepairPart",
          entityId: repairPart.id,
          details: {
            repairOrderId: id,
            partId,
            partName: part.name,
            sku: part.sku,
            quantityUsed,
            recordedUnitCost: part.unitCost.toString(),
            remainingStock: updatedPart.quantity,
            isLowStock,
          },
        },
      });

      return {
        repairPart,
        inventoryPart: {
          ...updatedPart,
          isLowStock,
        },
      };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(
      {
        message: "Part consumed successfully",
        repairPart: result.repairPart,
        inventoryPart: result.inventoryPart,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/repair-orders/[id]/parts error:", error);
    return NextResponse.json(
      { error: "Internal server error consuming repair part" },
      { status: 500 }
    );
  }
}
