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

    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        repairOrders: {
          select: {
            id: true,
            referenceNumber: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Uniform 404 response to prevent information disclosure (UC-10, NFR-06)
    if (!device || (user.role === Role.CUSTOMER && device.customerId !== user.id)) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ device });
  } catch (error) {
    console.error("GET /api/devices/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching device" },
      { status: 500 }
    );
  }
}
