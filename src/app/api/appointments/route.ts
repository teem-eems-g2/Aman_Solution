import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { AppointmentStatus, Role, Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const repairOrderId = searchParams.get("repairOrderId");
    const statusParam = searchParams.get("status") as AppointmentStatus | null;

    const whereClause: Prisma.AppointmentWhereInput = {};

    if (repairOrderId) {
      whereClause.repairOrderId = repairOrderId;
    }

    if (statusParam && Object.values(AppointmentStatus).includes(statusParam)) {
      whereClause.status = statusParam;
    }

    // Role-based scoping
    if (user.role === Role.CUSTOMER) {
      whereClause.repairOrder = { customerId: user.id };
    } else if (user.role === Role.TECHNICIAN) {
      whereClause.repairOrder = { assignedTechId: user.id };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        repairOrder: {
          select: {
            id: true,
            referenceNumber: true,
            status: true,
            customerId: true,
            assignedTechId: true,
          },
        },
      },
      orderBy: { scheduledStart: "asc" },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("GET /api/appointments error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching appointments" },
      { status: 500 }
    );
  }
}
