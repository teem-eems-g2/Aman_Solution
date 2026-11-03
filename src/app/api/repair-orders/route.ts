import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { generateRepairReference } from "@/lib/reference";
import { DeviceCategory, RepairStatus, AppointmentStatus, Role, Prisma } from "@prisma/client";

const inlineDeviceSchema = z.object({
  category: z.nativeEnum(DeviceCategory),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  serialNumber: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().default([]),
});

const createRepairOrderSchema = z
  .object({
    deviceId: z.string().min(1).optional(),
    device: inlineDeviceSchema.optional(),
    serviceId: z.string().min(1).optional().nullable(),
    issueDescription: z.string().min(10, "Issue description must be at least 10 characters"),
    preferredAppointmentStart: z.string().datetime().optional().nullable(),
    preferredAppointmentEnd: z.string().datetime().optional().nullable(),
  })
  .refine((data) => data.deviceId || data.device, {
    message: "Either deviceId or an inline device object must be provided",
    path: ["deviceId"],
  })
  .refine(
    (data) => {
      if (data.preferredAppointmentStart && data.preferredAppointmentEnd) {
        return new Date(data.preferredAppointmentStart) < new Date(data.preferredAppointmentEnd);
      }
      return true;
    },
    {
      message: "preferredAppointmentStart must be before preferredAppointmentEnd",
      path: ["preferredAppointmentEnd"],
    }
  );

export async function POST(req: Request) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = createRepairOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      deviceId,
      device: inlineDevice,
      serviceId,
      issueDescription,
      preferredAppointmentStart,
      preferredAppointmentEnd,
    } = parsed.data;

    let targetDeviceCategory: DeviceCategory;
    let targetDeviceId: string;

    // Verify existing device ownership or prepare inline device
    if (deviceId) {
      const existingDevice = await prisma.device.findUnique({
        where: { id: deviceId },
      });

      if (!existingDevice) {
        return NextResponse.json(
          { error: "Resource not found or access denied" },
          { status: 404 }
        );
      }

      if (user.role === Role.CUSTOMER && existingDevice.customerId !== user.id) {
        return NextResponse.json(
          { error: "Resource not found or access denied" },
          { status: 404 }
        );
      }

      targetDeviceId = existingDevice.id;
      targetDeviceCategory = existingDevice.category;
    } else if (inlineDevice) {
      targetDeviceCategory = inlineDevice.category;
      targetDeviceId = ""; // Will be assigned during transaction
    } else {
      return NextResponse.json({ error: "Device is required" }, { status: 400 });
    }

    // Validate service if provided (FR-17)
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        return NextResponse.json({ error: "Selected service does not exist" }, { status: 400 });
      }

      // Check isActive === true
      if (!service.isActive) {
        return NextResponse.json(
          { error: "Selected service is deactivated and unavailable for new orders (FR-17)" },
          { status: 400 }
        );
      }

      // Check service category matches device category
      if (service.category !== targetDeviceCategory) {
        return NextResponse.json(
          {
            error: `Selected service category (${service.category}) does not match device category (${targetDeviceCategory})`,
          },
          { status: 400 }
        );
      }
    }

    const referenceNumber = await generateRepairReference();

    // Execute creation inside a single atomic transaction
    const createdOrder = await prisma.$transaction(async (tx) => {
      // 1. Create Device if inline
      if (!deviceId && inlineDevice) {
        const newDevice = await tx.device.create({
          data: {
            customerId: user.id,
            category: inlineDevice.category,
            brand: inlineDevice.brand.trim(),
            model: inlineDevice.model.trim(),
            serialNumber: inlineDevice.serialNumber?.trim() || null,
            photos: inlineDevice.photos || [],
          },
        });
        targetDeviceId = newDevice.id;
      }

      // 2. Create RepairOrder
      const order = await tx.repairOrder.create({
        data: {
          referenceNumber,
          customerId: user.id,
          deviceId: targetDeviceId,
          serviceId: serviceId || null,
          issueDescription: issueDescription.trim(),
          status: RepairStatus.SUBMITTED,
        },
        include: {
          device: true,
          service: true,
        },
      });

      // 3. Create initial RepairUpdate
      await tx.repairUpdate.create({
        data: {
          repairOrderId: order.id,
          actorId: user.id,
          previousStatus: null,
          newStatus: RepairStatus.SUBMITTED,
          notes: "Repair request submitted",
        },
      });

      // 4. Create preferred Appointment if requested
      if (preferredAppointmentStart && preferredAppointmentEnd) {
        await tx.appointment.create({
          data: {
            repairOrderId: order.id,
            scheduledStart: new Date(preferredAppointmentStart),
            scheduledEnd: new Date(preferredAppointmentEnd),
            status: AppointmentStatus.REQUESTED,
            notes: "Customer preferred appointment slot",
          },
        });
      }

      // 5. Create Customer Notification
      await tx.notification.create({
        data: {
          recipientId: user.id,
          eventType: "REPAIR_ORDER_SUBMITTED",
          message: `Your repair order ${referenceNumber} has been submitted successfully and is pending review.`,
          deliveryStatus: "DELIVERED",
        },
      });

      // 6. Record AuditLog
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "REPAIR_ORDER_SUBMITTED",
          entityType: "RepairOrder",
          entityId: order.id,
          details: {
            referenceNumber,
            deviceId: targetDeviceId,
            serviceId,
            hasPreferredAppointment: !!(preferredAppointmentStart && preferredAppointmentEnd),
          },
        },
      });

      return await tx.repairOrder.findUnique({
        where: { id: order.id },
        include: {
          device: true,
          service: true,
          appointments: true,
        },
      });
    });

    return NextResponse.json(
      {
        message: "Repair order submitted successfully",
        repairOrder: createdOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/repair-orders error:", error);
    return NextResponse.json(
      { error: "Internal server error submitting repair order" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const statusParam = searchParams.get("status") as RepairStatus | null;
    const refParam = searchParams.get("referenceNumber");

    const whereClause: Prisma.RepairOrderWhereInput = {};

    // Role scoping (BR-04, NFR-06)
    if (user.role === Role.CUSTOMER) {
      whereClause.customerId = user.id;
    } else if (user.role === Role.TECHNICIAN) {
      whereClause.assignedTechId = user.id;
    }

    if (statusParam && Object.values(RepairStatus).includes(statusParam)) {
      whereClause.status = statusParam;
    }

    if (refParam) {
      whereClause.referenceNumber = { contains: refParam.trim(), mode: "insensitive" };
    }

    const [total, repairOrders] = await Promise.all([
      prisma.repairOrder.count({ where: whereClause }),
      prisma.repairOrder.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          device: true,
          service: true,
          appointments: {
            orderBy: { createdAt: "desc" },
          },
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          assignedTech: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      repairOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("GET /api/repair-orders error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching repair orders" },
      { status: 500 }
    );
  }
}
