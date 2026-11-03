import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { Role, UserStatus } from "@prisma/client";

const updateStaffSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(9).optional(),
  role: z.enum([Role.TECHNICIAN, Role.ADMIN]).optional(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED]).optional(),
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
    const parsed = updateStaffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existingStaff = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingStaff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const dataToUpdate: {
      name?: string;
      phone?: string;
      role?: Role;
      status?: UserStatus;
    } = {};

    if (parsed.data.name) dataToUpdate.name = parsed.data.name.trim();
    if (parsed.data.phone) dataToUpdate.phone = parsed.data.phone.trim();
    if (parsed.data.role) dataToUpdate.role = parsed.data.role;
    if (parsed.data.status) dataToUpdate.status = parsed.data.status;

    const updatedStaff = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    await logAudit({
      actorId: admin.id,
      action: "STAFF_UPDATED",
      entityType: "User",
      entityId: id,
      details: {
        previousRole: existingStaff.role,
        previousStatus: existingStaff.status,
        updatedFields: dataToUpdate,
      },
    });

    return NextResponse.json({
      message: "Staff member updated successfully",
      staff: updatedStaff,
    });
  } catch (error) {
    console.error("Staff update error:", error);
    return NextResponse.json(
      { error: "Internal server error during staff update" },
      { status: 500 }
    );
  }
}
