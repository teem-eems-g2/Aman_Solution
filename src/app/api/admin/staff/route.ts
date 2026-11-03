import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { Role, UserStatus } from "@prisma/client";

const createStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(9, "Phone number must be at least 9 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum([Role.TECHNICIAN, Role.ADMIN]),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED]).default(UserStatus.ACTIVE),
});

export async function GET() {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  const staff = await prisma.user.findMany({
    where: {
      role: { in: [Role.TECHNICIAN, Role.ADMIN] },
    },
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
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ staff });
}

export async function POST(req: Request) {
  const { user: admin, errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = createStaffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, phone, password, role, status } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newStaff = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        passwordHash,
        role,
        status,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await logAudit({
      actorId: admin.id,
      action: "STAFF_CREATED",
      entityType: "User",
      entityId: newStaff.id,
      details: {
        email: newStaff.email,
        role: newStaff.role,
        status: newStaff.status,
      },
    });

    return NextResponse.json(
      {
        message: "Staff member created successfully",
        staff: newStaff,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Staff creation error:", error);
    return NextResponse.json(
      { error: "Internal server error during staff creation" },
      { status: 500 }
    );
  }
}
