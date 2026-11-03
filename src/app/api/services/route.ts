import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { auth } from "@/auth";
import { DeviceCategory, Role, Prisma } from "@prisma/client";

const createServiceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  category: z.nativeEnum(DeviceCategory),
  indicativePrice: z.coerce.number().positive("Price must be a positive number"),
  isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryParam = searchParams.get("category");
    const includeInactiveParam = searchParams.get("includeInactive") === "true";

    let allowInactive = false;
    if (includeInactiveParam) {
      const session = await auth();
      if (session?.user?.id) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true, status: true },
        });
        if (user?.role === Role.ADMIN && user?.status === "ACTIVE") {
          allowInactive = true;
        }
      }
    }

    const whereClause: Prisma.ServiceWhereInput = {};

    if (!allowInactive) {
      whereClause.isActive = true;
    }

    if (categoryParam) {
      if (Object.values(DeviceCategory).includes(categoryParam as DeviceCategory)) {
        whereClause.category = categoryParam as DeviceCategory;
      }
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("GET /api/services error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching services" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { user: admin, errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = createServiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, category, indicativePrice, isActive } = parsed.data;

    const newService = await prisma.service.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        category,
        indicativePrice: new Prisma.Decimal(indicativePrice.toFixed(2)),
        isActive,
      },
    });

    await logAudit({
      actorId: admin.id,
      action: "SERVICE_CREATED",
      entityType: "Service",
      entityId: newService.id,
      details: {
        name: newService.name,
        category: newService.category,
        indicativePrice: newService.indicativePrice.toString(),
        isActive: newService.isActive,
      },
    });

    return NextResponse.json(
      {
        message: "Service created successfully",
        service: newService,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/services error:", error);
    return NextResponse.json(
      { error: "Internal server error creating service" },
      { status: 500 }
    );
  }
}
