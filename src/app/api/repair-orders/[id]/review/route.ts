import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { Role, RepairStatus, UserStatus } from "@prisma/client";

const reviewRepairOrderSchema = z.object({
  status: z.enum([
    RepairStatus.ACCEPTED,
    RepairStatus.REJECTED,
    RepairStatus.NEEDS_CLARIFICATION,
  ]),
  assignedTechId: z.string().min(1).optional().nullable(),
  notes: z.string().min(1, "Review notes are required"),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: admin, errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = reviewRepairOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, assignedTechId, notes } = parsed.data;

    const existingOrder = await prisma.repairOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Repair order not found" }, { status: 404 });
    }

    // If technician is being assigned, verify active technician account
    if (assignedTechId) {
      const technician = await prisma.user.findUnique({
        where: { id: assignedTechId },
      });

      if (!technician || technician.role !== Role.TECHNICIAN || technician.status !== UserStatus.ACTIVE) {
        return NextResponse.json(
          { error: "Assigned user must be an active technician" },
          { status: 400 }
        );
      }
    }

    // Execute atomic review updates
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.repairOrder.update({
        where: { id },
        data: {
          status,
          ...(assignedTechId !== undefined ? { assignedTechId } : {}),
          diagnosisNotes: existingOrder.diagnosisNotes
            ? `${existingOrder.diagnosisNotes}\n[Staff Review]: ${notes}`
            : `[Staff Review]: ${notes}`,
        },
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          device: true,
          service: true,
          assignedTech: {
            select: { id: true, name: true, email: true, phone: true },
          },
          appointments: true,
        },
      });

      // Insert RepairUpdate row
      const updateRow = await tx.repairUpdate.create({
        data: {
          repairOrderId: id,
          actorId: admin.id,
          previousStatus: existingOrder.status,
          newStatus: status,
          notes: notes.trim(),
        },
      });

      // Notification to customer
      await tx.notification.create({
        data: {
          recipientId: existingOrder.customerId,
          eventType: `REPAIR_ORDER_${status}`,
          message: `Your repair request ${existingOrder.referenceNumber} status changed to ${status}. Notes: ${notes}`,
          deliveryStatus: "DELIVERED",
        },
      });

      // Notification to technician if assigned
      if (assignedTechId) {
        await tx.notification.create({
          data: {
            recipientId: assignedTechId,
            eventType: "TECHNICIAN_ASSIGNED",
            message: `You have been assigned to repair order ${existingOrder.referenceNumber}.`,
            deliveryStatus: "DELIVERED",
          },
        });
      }

      // Record AuditLog
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "REPAIR_ORDER_REVIEWED",
          entityType: "RepairOrder",
          entityId: id,
          details: {
            previousStatus: existingOrder.status,
            newStatus: status,
            assignedTechId,
            notes,
          },
        },
      });

      return { updatedOrder, updateRow };
    });

    return NextResponse.json({
      message: `Repair order successfully reviewed and marked as ${status}`,
      repairOrder: result.updatedOrder,
      update: result.updateRow,
    });
  } catch (error) {
    console.error("PATCH /api/repair-orders/[id]/review error:", error);
    return NextResponse.json(
      { error: "Internal server error during staff review" },
      { status: 500 }
    );
  }
}
