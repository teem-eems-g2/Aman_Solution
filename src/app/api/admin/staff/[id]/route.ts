import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { Role, UserStatus } from "@prisma/client";

const updateStaffSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().trim().toLowerCase().email("Invalid email address").optional(),
  phone: z.string().trim().min(9, "Phone number must be at least 9 characters").optional(),
  role: z.enum([Role.TECHNICIAN, Role.ADMIN]).optional(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED]).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const staffMember = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { assignedRepairOrders: true },
        },
      },
    });

    if (!staffMember) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json({ staff: staffMember });
  } catch (error) {
    console.error("Staff fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching staff member" },
      { status: 500 }
    );
  }
}

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

    // Business rule BR-03: Admins cannot demote or deactivate/suspend their own account
    if (existingStaff.id === admin.id) {
      if (parsed.data.role && parsed.data.role !== Role.ADMIN) {
        return NextResponse.json(
          { error: "Cannot demote your own admin account (BR-03)." },
          { status: 403 }
        );
      }
      if (parsed.data.status && parsed.data.status !== UserStatus.ACTIVE) {
        return NextResponse.json(
          { error: "Cannot deactivate or suspend your own admin account (BR-03)." },
          { status: 403 }
        );
      }
    }

    const dataToUpdate: {
      name?: string;
      email?: string;
      phone?: string;
      role?: Role;
      status?: UserStatus;
    } = {};

    // 1. Email normalization and uniqueness validation
    if (parsed.data.email !== undefined) {
      const normalizedEmail = parsed.data.email.toLowerCase().trim();
      if (normalizedEmail !== existingStaff.email.toLowerCase().trim()) {
        const emailInUse = await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
            NOT: { id: existingStaff.id },
          },
        });

        if (emailInUse) {
          return NextResponse.json(
            { error: "Another account is already using this email address" },
            { status: 409 }
          );
        }

        dataToUpdate.email = normalizedEmail;
      }
    }

    // 2. Name validation and trimming
    if (parsed.data.name !== undefined) {
      dataToUpdate.name = parsed.data.name.trim();
    }

    // 3. Phone validation and trimming
    if (parsed.data.phone !== undefined) {
      dataToUpdate.phone = parsed.data.phone.trim();
    }

    // 4. Role
    if (parsed.data.role !== undefined) {
      dataToUpdate.role = parsed.data.role;
    }

    // 5. Status
    if (parsed.data.status !== undefined) {
      dataToUpdate.status = parsed.data.status;
    }

    // If nothing changed, return existing staff
    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({
        message: "No changes detected",
        staff: {
          id: existingStaff.id,
          name: existingStaff.name,
          email: existingStaff.email,
          phone: existingStaff.phone,
          role: existingStaff.role,
          status: existingStaff.status,
          updatedAt: existingStaff.updatedAt,
        },
      });
    }

    // Update existing user record in place (preserves ID, passwordHash, and related relations)
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
        createdAt: true,
        updatedAt: true,
      },
    });

    // Record staff-detail changes in the system audit logs
    await logAudit({
      actorId: admin.id,
      action: "STAFF_UPDATED",
      entityType: "User",
      entityId: id,
      details: {
        previousValues: {
          name: existingStaff.name,
          email: existingStaff.email,
          phone: existingStaff.phone,
          role: existingStaff.role,
          status: existingStaff.status,
        },
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
