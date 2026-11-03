import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { DeviceCategory, Role, Prisma } from "@prisma/client";

const createDeviceSchema = z.object({
  category: z.nativeEnum(DeviceCategory),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  serialNumber: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().default([]),
  customerId: z.string().optional(),
});

export async function GET(req: Request) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const customerIdParam = searchParams.get("customerId");

    const whereClause: Prisma.DeviceWhereInput = {};

    if (user.role === Role.CUSTOMER) {
      // Strictly restrict customer to their own devices
      whereClause.customerId = user.id;
    } else {
      // ADMIN or TECHNICIAN can view all or filter by customerId
      if (customerIdParam) {
        whereClause.customerId = customerIdParam;
      }
    }

    const devices = await prisma.device.findMany({
      where: whereClause,
      include: {
        repairOrders: {
          select: {
            id: true,
            referenceNumber: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ devices });
  } catch (error) {
    console.error("GET /api/devices error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching devices" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = createDeviceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { category, brand, model, serialNumber, photos } = parsed.data;

    // Force customerId = user.id for customers; allow staff to specify customerId
    let targetCustomerId = user.id;
    if (user.role !== Role.CUSTOMER && parsed.data.customerId) {
      targetCustomerId = parsed.data.customerId;
    }

    const device = await prisma.device.create({
      data: {
        customerId: targetCustomerId,
        category,
        brand: brand.trim(),
        model: model.trim(),
        serialNumber: serialNumber?.trim() || null,
        photos: photos || [],
      },
    });

    await logAudit({
      actorId: user.id,
      action: "DEVICE_REGISTERED",
      entityType: "Device",
      entityId: device.id,
      details: {
        customerId: targetCustomerId,
        category: device.category,
        brand: device.brand,
        model: device.model,
        photoCount: device.photos.length,
      },
    });

    return NextResponse.json(
      {
        message: "Device registered successfully",
        device,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/devices error:", error);
    return NextResponse.json(
      { error: "Internal server error registering device" },
      { status: 500 }
    );
  }
}
