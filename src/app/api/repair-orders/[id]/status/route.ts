import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { verifyOrderAccess } from "@/lib/order-access";
import { Role, RepairStatus, QuotationStatus, Prisma } from "@prisma/client";

const statusUpdateSchema = z.object({
  newStatus: z.nativeEnum(RepairStatus, {
    message: "Invalid repair status",
  }),
  notes: z.string().min(1, "Notes are required for status update (FR-35)"),
  testingResults: z.string().optional(),
  handoverConfirmed: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireRole([Role.TECHNICIAN, Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = statusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const order = await prisma.repairOrder.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        device: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Repair order not found" }, { status: 404 });
    }

    // BR-04: Technician assignment guard
    const access = verifyOrderAccess(order, user, { requireWrite: true });
    if (!access.allowed) {
      return access.errorResponse!;
    }

    const { newStatus, notes, testingResults, handoverConfirmed } = parsed.data;

    // BR-06 & BR-07: Repair execution guards
    const inRepairWorkflowStatuses: RepairStatus[] = [
      RepairStatus.IN_REPAIR,
      RepairStatus.TESTING,
      RepairStatus.READY_FOR_COLLECTION,
      RepairStatus.COMPLETED,
    ];
    const inRepairWorkflow = inRepairWorkflowStatuses.includes(newStatus);

    if (inRepairWorkflow) {
      const quotations = await prisma.quotation.findMany({
        where: { repairOrderId: id },
        select: { status: true },
      });

      const hasApproved = quotations.some((q) => q.status === QuotationStatus.APPROVED);
      if (!hasApproved) {
        return NextResponse.json(
          { error: "Cannot proceed to repair: No approved quotation found for this order (BR-06)" },
          { status: 400 }
        );
      }

      const hasPending = quotations.some((q) => q.status === QuotationStatus.PENDING);
      if (hasPending) {
        return NextResponse.json(
          { error: "Cannot proceed to repair: There is a pending quotation awaiting customer approval (BR-07)" },
          { status: 400 }
        );
      }
    }

    // FR-39: Testing results required before READY_FOR_COLLECTION
    if (newStatus === RepairStatus.READY_FOR_COLLECTION) {
      const effectiveTestingResults = testingResults?.trim() || order.testingResults?.trim();
      if (!effectiveTestingResults) {
        return NextResponse.json(
          { error: "Testing results are required before marking order READY_FOR_COLLECTION (FR-39)" },
          { status: 400 }
        );
      }
    }

    // BR-09 & FR-41: Handover confirmation required before COMPLETED
    if (newStatus === RepairStatus.COMPLETED) {
      const isHandoverConfirmed = handoverConfirmed === true || Boolean(order.handoverConfirmedAt);
      if (!isHandoverConfirmed) {
        return NextResponse.json(
          { error: "Device handover must be confirmed before marking order COMPLETED (BR-09, FR-41)" },
          { status: 400 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateData: Prisma.RepairOrderUpdateInput = {
        status: newStatus,
      };

      if (testingResults?.trim()) {
        updateData.testingResults = testingResults.trim();
      }

      if (handoverConfirmed === true && !order.handoverConfirmedAt) {
        updateData.handoverConfirmedAt = new Date();
      }

      const updatedOrder = await tx.repairOrder.update({
        where: { id },
        data: updateData,
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          device: true,
          service: true,
          assignedTech: { select: { id: true, name: true, email: true, phone: true } },
          quotations: {
            include: { items: true },
            orderBy: { version: "desc" },
          },
        },
      });

      const updateRow = await tx.repairUpdate.create({
        data: {
          repairOrderId: id,
          actorId: user.id,
          previousStatus: order.status,
          newStatus,
          notes: notes.trim(),
        },
      });

      // Customer notifications on milestone transitions
      if (newStatus === RepairStatus.READY_FOR_COLLECTION) {
        await tx.notification.create({
          data: {
            recipientId: order.customerId,
            eventType: "REPAIR_READY_FOR_COLLECTION",
            message: `Your device (${order.device.brand} ${order.device.model}) is ready for collection! Reference: ${order.referenceNumber}`,
            deliveryStatus: "DELIVERED",
          },
        });
      } else if (newStatus === RepairStatus.COMPLETED) {
        await tx.notification.create({
          data: {
            recipientId: order.customerId,
            eventType: "REPAIR_COMPLETED",
            message: `Your repair order ${order.referenceNumber} has been marked COMPLETED. Thank you for choosing Amanuel Mobile and Computer Maintenance!`,
            deliveryStatus: "DELIVERED",
          },
        });
      }

      // Record AuditLog
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "REPAIR_ORDER_STATUS_CHANGED",
          entityType: "RepairOrder",
          entityId: id,
          details: {
            previousStatus: order.status,
            newStatus,
            notes: notes.trim(),
            testingResults: testingResults?.trim() || null,
            handoverConfirmed: handoverConfirmed === true,
          },
        },
      });

      return { updatedOrder, updateRow };
    });

    return NextResponse.json({
      message: `Repair order status updated to ${newStatus}`,
      repairOrder: result.updatedOrder,
      update: result.updateRow,
    });
  } catch (error) {
    console.error("PATCH /api/repair-orders/[id]/status error:", error);
    return NextResponse.json(
      { error: "Internal server error updating repair order status" },
      { status: 500 }
    );
  }
}
