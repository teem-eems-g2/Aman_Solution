import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { Role, AppointmentStatus } from "@prisma/client";

const updateAppointmentSchema = z
  .object({
    status: z.nativeEnum(AppointmentStatus).optional(),
    scheduledStart: z.string().datetime().optional(),
    scheduledEnd: z.string().datetime().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.scheduledStart && data.scheduledEnd) {
        return new Date(data.scheduledStart) < new Date(data.scheduledEnd);
      }
      return true;
    },
    {
      message: "scheduledStart must be before scheduledEnd",
      path: ["scheduledEnd"],
    }
  );

const MAX_CONCURRENT_APPOINTMENTS = parseInt(
  process.env.MAX_CONCURRENT_APPOINTMENTS || "1",
  10
);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: admin, errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const currentAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        repairOrder: true,
      },
    });

    if (!currentAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const { status, scheduledStart, scheduledEnd, notes } = parsed.data;

    const newStart = scheduledStart ? new Date(scheduledStart) : currentAppointment.scheduledStart;
    const newEnd = scheduledEnd ? new Date(scheduledEnd) : currentAppointment.scheduledEnd;
    const targetStatus = status || currentAppointment.status;

    if (newStart >= newEnd) {
      return NextResponse.json(
        { error: "scheduledStart must be strictly earlier than scheduledEnd" },
        { status: 400 }
      );
    }

    // Conflict Check (FR-25): When confirming or rescheduling into CONFIRMED status
    if (targetStatus === AppointmentStatus.CONFIRMED) {
      const overlappingCount = await prisma.appointment.count({
        where: {
          id: { not: id },
          status: AppointmentStatus.CONFIRMED,
          scheduledStart: { lt: newEnd },
          scheduledEnd: { gt: newStart },
        },
      });

      if (overlappingCount >= MAX_CONCURRENT_APPOINTMENTS) {
        return NextResponse.json(
          {
            error: `Appointment conflict detected: Maximum concurrent appointment limit (${MAX_CONCURRENT_APPOINTMENTS}) exceeded for slot between ${newStart.toISOString()} and ${newEnd.toISOString()} (FR-25).`,
            overlappingCount,
          },
          { status: 409 }
        );
      }
    }

    // Execute update atomically
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(scheduledStart ? { scheduledStart: newStart } : {}),
          ...(scheduledEnd ? { scheduledEnd: newEnd } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
      });

      // Notify customer of appointment update
      await tx.notification.create({
        data: {
          recipientId: currentAppointment.repairOrder.customerId,
          eventType: `APPOINTMENT_${targetStatus}`,
          message: `Your appointment for repair order ${currentAppointment.repairOrder.referenceNumber} has been updated to ${targetStatus} (${newStart.toISOString()} - ${newEnd.toISOString()}).`,
          deliveryStatus: "DELIVERED",
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "APPOINTMENT_UPDATED",
          entityType: "Appointment",
          entityId: id,
          details: {
            repairOrderId: currentAppointment.repairOrderId,
            previousStatus: currentAppointment.status,
            newStatus: targetStatus,
            scheduledStart: newStart.toISOString(),
            scheduledEnd: newEnd.toISOString(),
            notes,
          },
        },
      });

      return updated;
    });

    return NextResponse.json({
      message: `Appointment updated successfully to ${targetStatus}`,
      appointment: result,
    });
  } catch (error) {
    console.error("PATCH /api/appointments/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error updating appointment" },
      { status: 500 }
    );
  }
}
