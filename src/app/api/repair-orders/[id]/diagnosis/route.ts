import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { verifyOrderAccess } from "@/lib/order-access";
import { Role, RepairStatus } from "@prisma/client";

const diagnosisSchema = z.object({
  diagnosisNotes: z.string().min(1, "Diagnosis notes are required"),
  status: z.enum([RepairStatus.RECEIVED, RepairStatus.DIAGNOSING]).optional(),
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
    const parsed = diagnosisSchema.safeParse(body);

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

    const { diagnosisNotes, status } = parsed.data;
    const newStatus = status || (order.status === RepairStatus.DIAGNOSING ? RepairStatus.DIAGNOSING : RepairStatus.DIAGNOSING);

    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.repairOrder.update({
        where: { id },
        data: {
          diagnosisNotes: order.diagnosisNotes
            ? `${order.diagnosisNotes}\n[${user.name} - Diagnosis]: ${diagnosisNotes.trim()}`
            : `[${user.name} - Diagnosis]: ${diagnosisNotes.trim()}`,
          status: newStatus,
        },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          device: true,
          service: true,
          assignedTech: { select: { id: true, name: true, email: true, phone: true } },
          appointments: true,
        },
      });

      const updateRow = await tx.repairUpdate.create({
        data: {
          repairOrderId: id,
          actorId: user.id,
          previousStatus: order.status,
          newStatus,
          notes: diagnosisNotes.trim(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "DIAGNOSIS_RECORDED",
          entityType: "RepairOrder",
          entityId: id,
          details: {
            previousStatus: order.status,
            newStatus,
            diagnosisNotes: diagnosisNotes.trim(),
          },
        },
      });

      return { updatedOrder, updateRow };
    });

    return NextResponse.json({
      message: "Diagnosis recorded successfully",
      repairOrder: result.updatedOrder,
      update: result.updateRow,
    });
  } catch (error) {
    console.error("PATCH /api/repair-orders/[id]/diagnosis error:", error);
    return NextResponse.json(
      { error: "Internal server error recording diagnosis" },
      { status: 500 }
    );
  }
}
