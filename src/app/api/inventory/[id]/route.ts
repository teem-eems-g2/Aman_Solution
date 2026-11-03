import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { Role, Prisma } from "@prisma/client";

const patchInventoryPartSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).transform((s) => s.trim().toUpperCase()).optional(),
  unitCost: z.coerce.number().positive().optional(),
  reorderThreshold: z.number().int().min(0).optional(),
  quantity: z.number().int().min(0).optional(),
  stockAdjustment: z.number().int().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireRole([Role.ADMIN, Role.TECHNICIAN]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;

    const part = await prisma.inventoryPart.findUnique({
      where: { id },
    });

    if (!part) {
      return NextResponse.json({ error: "Inventory part not found" }, { status: 404 });
    }

    return NextResponse.json({
      part: {
        ...part,
        isLowStock: part.quantity <= part.reorderThreshold,
      },
    });
  } catch (error) {
    console.error("GET /api/inventory/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching inventory part" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = patchInventoryPartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existingPart = await prisma.inventoryPart.findUnique({
      where: { id },
    });

    if (!existingPart) {
      return NextResponse.json({ error: "Inventory part not found" }, { status: 404 });
    }

    const { name, sku, unitCost, reorderThreshold, quantity, stockAdjustment } = parsed.data;

    // Check SKU conflict if sku changed
    if (sku && sku !== existingPart.sku) {
      const skuConflict = await prisma.inventoryPart.findUnique({
        where: { sku },
      });
      if (skuConflict) {
        return NextResponse.json(
          { error: `An inventory part with SKU '${sku}' already exists` },
          { status: 409 }
        );
      }
    }

    // Determine new quantity
    let newQuantity = existingPart.quantity;
    if (stockAdjustment !== undefined) {
      newQuantity = existingPart.quantity + stockAdjustment;
    } else if (quantity !== undefined) {
      newQuantity = quantity;
    }

    // BR-10: Reject negative stock
    if (newQuantity < 0) {
      return NextResponse.json(
        { error: "Resulting stock cannot be negative (BR-10)" },
        { status: 400 }
      );
    }

    const updateData: Prisma.InventoryPartUpdateInput = {
      quantity: newQuantity,
    };

    if (name) updateData.name = name;
    if (sku) updateData.sku = sku;
    if (reorderThreshold !== undefined) updateData.reorderThreshold = reorderThreshold;
    if (unitCost !== undefined) {
      updateData.unitCost = new Prisma.Decimal(unitCost.toFixed(2));
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.inventoryPart.update({
        where: { id },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "INVENTORY_STOCK_UPDATED",
          entityType: "InventoryPart",
          entityId: id,
          details: {
            sku: updated.sku,
            previousQuantity: existingPart.quantity,
            newQuantity: updated.quantity,
            stockAdjustment: stockAdjustment || 0,
            reorderThreshold: updated.reorderThreshold,
          },
        },
      });

      return updated;
    });

    return NextResponse.json({
      message: "Inventory part updated successfully",
      part: {
        ...result,
        isLowStock: result.quantity <= result.reorderThreshold,
      },
    });
  } catch (error) {
    console.error("PATCH /api/inventory/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error updating inventory part" },
      { status: 500 }
    );
  }
}
