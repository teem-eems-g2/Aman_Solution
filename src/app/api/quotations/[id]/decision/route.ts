import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { Role, QuotationStatus, RepairStatus } from "@prisma/client";

const decisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireRole([Role.CUSTOMER, Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = decisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        repairOrder: {
          select: {
            id: true,
            referenceNumber: true,
            customerId: true,
            assignedTechId: true,
            status: true,
          },
        },
        items: true,
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    // Ownership check for customers (NFR-06, UC-10)
    if (user.role === Role.CUSTOMER && quotation.repairOrder.customerId !== user.id) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    // Check quotation status
    if (quotation.status !== QuotationStatus.PENDING) {
      return NextResponse.json(
        { error: `Quotation is already ${quotation.status.toLowerCase()} and cannot be modified` },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > quotation.validUntil) {
      await prisma.quotation.update({
        where: { id },
        data: { status: QuotationStatus.EXPIRED },
      });
      return NextResponse.json(
        { error: "Quotation has expired and cannot be approved or rejected" },
        { status: 400 }
      );
    }

    const { decision } = parsed.data;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Quotation
      const updatedQuotation = await tx.quotation.update({
        where: { id },
        data: {
          status: decision === "APPROVED" ? QuotationStatus.APPROVED : QuotationStatus.REJECTED,
          decisionAt: now,
        },
        include: {
          items: true,
        },
      });

      // 2. Update RepairOrder status
      const newOrderStatus =
        decision === "APPROVED" ? RepairStatus.APPROVED : quotation.repairOrder.status;

      let updatedOrder = quotation.repairOrder;
      if (newOrderStatus !== quotation.repairOrder.status) {
        updatedOrder = await tx.repairOrder.update({
          where: { id: quotation.repairOrderId },
          data: { status: newOrderStatus },
          select: {
            id: true,
            referenceNumber: true,
            customerId: true,
            assignedTechId: true,
            status: true,
          },
        });
      }

      // 3. Record RepairUpdate
      await tx.repairUpdate.create({
        data: {
          repairOrderId: quotation.repairOrderId,
          actorId: user.id,
          previousStatus: quotation.repairOrder.status,
          newStatus: newOrderStatus,
          notes: `Quotation v${quotation.version} ${decision.toLowerCase()} by customer.`,
        },
      });

      // 4. Notify assigned technician (or admin if unassigned)
      const recipientId = quotation.repairOrder.assignedTechId;
      if (recipientId) {
        await tx.notification.create({
          data: {
            recipientId,
            eventType: `QUOTATION_${decision}`,
            message: `Quotation v${quotation.version} for order ${quotation.repairOrder.referenceNumber} has been ${decision.toLowerCase()} by customer.`,
            deliveryStatus: "DELIVERED",
          },
        });
      }

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "QUOTATION_DECIDED",
          entityType: "Quotation",
          entityId: id,
          details: {
            repairOrderId: quotation.repairOrderId,
            version: quotation.version,
            decision,
            newOrderStatus,
          },
        },
      });

      return { updatedQuotation, updatedOrder };
    });

    return NextResponse.json({
      message: `Quotation v${result.updatedQuotation.version} ${decision.toLowerCase()} successfully`,
      quotation: result.updatedQuotation,
      repairOrder: result.updatedOrder,
    });
  } catch (error) {
    console.error("PATCH /api/quotations/[id]/decision error:", error);
    return NextResponse.json(
      { error: "Internal server error deciding on quotation" },
      { status: 500 }
    );
  }
}
