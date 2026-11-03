import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { DeviceCategory, Role, Prisma } from "@prisma/client";

const updateServiceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().min(5, "Description must be at least 5 characters").optional(),
  category: z.nativeEnum(DeviceCategory).optional(),
  indicativePrice: z.coerce.number().positive("Price must be a positive number").optional(),
  isActive: z.boolean().optional(),
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
    const parsed = updateServiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const dataToUpdate: Prisma.ServiceUpdateInput = {};

    if (parsed.data.name !== undefined) dataToUpdate.name = parsed.data.name.trim();
    if (parsed.data.description !== undefined) dataToUpdate.description = parsed.data.description.trim();
    if (parsed.data.category !== undefined) dataToUpdate.category = parsed.data.category;
    if (parsed.data.indicativePrice !== undefined) {
      dataToUpdate.indicativePrice = new Prisma.Decimal(parsed.data.indicativePrice.toFixed(2));
    }
    if (parsed.data.isActive !== undefined) dataToUpdate.isActive = parsed.data.isActive;

    const updatedService = await prisma.service.update({
      where: { id },
      data: dataToUpdate,
    });

    // Check if service was deactivated or updated
    let auditAction = "SERVICE_UPDATED";
    if (existingService.isActive && parsed.data.isActive === false) {
      auditAction = "SERVICE_DEACTIVATED";
    }

    await logAudit({
      actorId: admin.id,
      action: auditAction,
      entityType: "Service",
      entityId: id,
      details: {
        previous: {
          name: existingService.name,
          indicativePrice: existingService.indicativePrice.toString(),
          isActive: existingService.isActive,
        },
        updated: {
          name: updatedService.name,
          indicativePrice: updatedService.indicativePrice.toString(),
          isActive: updatedService.isActive,
        },
      },
    });

    return NextResponse.json({
      message: "Service updated successfully",
      service: updatedService,
    });
  } catch (error) {
    console.error("PATCH /api/services/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error updating service" },
      { status: 500 }
    );
  }
}
