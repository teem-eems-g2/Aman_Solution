import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().min(9, "Phone must be at least 9 characters").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters").optional(),
});

export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
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

  return NextResponse.json({ user: profile });
}

export async function PATCH(req: Request) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, phone, currentPassword, newPassword } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dataToUpdate: {
      name?: string;
      phone?: string;
      passwordHash?: string;
    } = {};

    if (name) dataToUpdate.name = name.trim();
    if (phone) dataToUpdate.phone = phone.trim();

    let passwordChanged = false;
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change password" },
          { status: 400 }
        );
      }

      const match = await bcrypt.compare(currentPassword, existingUser.passwordHash);
      if (!match) {
        return NextResponse.json(
          { error: "Incorrect current password" },
          { status: 400 }
        );
      }

      dataToUpdate.passwordHash = await bcrypt.hash(newPassword, 12);
      passwordChanged = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
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
      actorId: user.id,
      action: passwordChanged ? "PROFILE_AND_PASSWORD_UPDATE" : "PROFILE_UPDATE",
      entityType: "User",
      entityId: user.id,
      details: {
        updatedFields: Object.keys(dataToUpdate).filter((k) => k !== "passwordHash"),
        passwordChanged,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error during profile update" },
      { status: 500 }
    );
  }
}
