import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { Role } from "@prisma/client";

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
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        device: true,
        service: true,
        assignedTech: {
          select: { id: true, name: true, email: true, phone: true },
        },
        appointments: {
          orderBy: { createdAt: "desc" },
        },
        updates: {
          include: {
            actor: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        quotations: {
          include: { items: true },
          orderBy: { version: "desc" },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
        repairParts: {
          include: { part: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Uniform 404 error to prevent information leakage (UC-10, NFR-06)
    if (!order) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    if (user.role === Role.CUSTOMER && order.customerId !== user.id) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    if (user.role === Role.TECHNICIAN && order.assignedTechId !== user.id) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ repairOrder: order });
  } catch (error) {
    console.error("GET /api/repair-orders/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching repair order" },
      { status: 500 }
    );
  }
}
