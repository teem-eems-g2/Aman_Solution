import React, { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import {
  TechnicianDashboardClient,
  SerializedTechnicianOrder,
  SerializedInventoryPart,
  SerializedNotification,
} from "./technician-dashboard-client";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Technician Workbench | Amanuel Mobile and Computer Maintenance",
  description:
    "Assigned job management queue, diagnosis recorder, quotation builder, and repair part consumption tool for authorized technicians.",
};

async function TechnicianDashboardContent({
  userId,
  userRole,
}: {
  userId: string;
  userRole: Role;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  if (!user) {
    redirect("/login");
  }

  // 1. Query assigned repair orders (or all if ADMIN inspecting the workbench)
  const rawOrders = await prisma.repairOrder.findMany({
    where: userRole === Role.ADMIN ? undefined : { assignedTechId: userId },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      device: true,
      service: true,
      quotations: {
        include: { items: true },
        orderBy: { version: "desc" },
      },
      repairParts: {
        include: {
          part: true,
        },
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
      appointments: {
        orderBy: { scheduledStart: "desc" },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Serialize orders for Client Component
  const serializedOrders: SerializedTechnicianOrder[] = rawOrders.map((order) => ({
    id: order.id,
    referenceNumber: order.referenceNumber,
    customerId: order.customerId,
    customer: {
      id: order.customer.id,
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
    },
    device: {
      id: order.device.id,
      category: order.device.category as SerializedTechnicianOrder["device"]["category"],
      brand: order.device.brand,
      model: order.device.model,
      serialNumber: order.device.serialNumber,
      photos: order.device.photos,
    },
    service: order.service
      ? {
          id: order.service.id,
          name: order.service.name,
          indicativePrice: order.service.indicativePrice.toString(),
        }
      : null,
    issueDescription: order.issueDescription,
    diagnosisNotes: order.diagnosisNotes,
    testingResults: order.testingResults,
    status: order.status as SerializedTechnicianOrder["status"],
    handoverConfirmedAt: order.handoverConfirmedAt ? order.handoverConfirmedAt.toISOString() : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    quotations: order.quotations.map((q) => ({
      id: q.id,
      version: q.version,
      totalAmount: q.totalAmount.toString(),
      currency: q.currency,
      validUntil: q.validUntil.toISOString(),
      status: q.status as SerializedTechnicianOrder["quotations"][number]["status"],
      isAdditionalWork: q.isAdditionalWork,
      decisionAt: q.decisionAt ? q.decisionAt.toISOString() : null,
      createdAt: q.createdAt.toISOString(),
      items: q.items.map((it) => ({
        id: it.id,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice.toString(),
        lineTotal: it.lineTotal.toString(),
      })),
    })),
    repairParts: order.repairParts.map((rp) => ({
      id: rp.id,
      partId: rp.partId,
      quantityUsed: rp.quantityUsed,
      recordedUnitCost: rp.recordedUnitCost.toString(),
      createdAt: rp.createdAt.toISOString(),
      part: {
        id: rp.part.id,
        name: rp.part.name,
        sku: rp.part.sku,
        quantity: rp.part.quantity,
        reorderThreshold: rp.part.reorderThreshold,
        unitCost: rp.part.unitCost.toString(),
      },
    })),
    updates: order.updates.map((u) => ({
      id: u.id,
      previousStatus: u.previousStatus,
      newStatus: u.newStatus,
      notes: u.notes,
      createdAt: u.createdAt.toISOString(),
      actorName: u.actor.name,
      actorRole: u.actor.role,
    })),
    appointments: order.appointments.map((a) => ({
      id: a.id,
      scheduledStart: a.scheduledStart.toISOString(),
      scheduledEnd: a.scheduledEnd.toISOString(),
      status: a.status,
      notes: a.notes,
    })),
    payments: order.payments.map((p) => ({
      id: p.id,
      amount: p.amount.toString(),
      method: p.method,
      type: p.type,
      receiptNumber: p.receiptNumber,
      createdAt: p.createdAt.toISOString(),
    })),
  }));

  // 2. Query available inventory parts for part consumption tool
  const rawInventory = await prisma.inventoryPart.findMany({
    orderBy: { name: "asc" },
  });

  const serializedInventory: SerializedInventoryPart[] = rawInventory.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    quantity: p.quantity,
    reorderThreshold: p.reorderThreshold,
    unitCost: p.unitCost.toString(),
    isLowStock: p.quantity <= p.reorderThreshold,
  }));

  // 3. Query technician notifications
  const rawNotifications = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const serializedNotifications: SerializedNotification[] = rawNotifications.map((n) => ({
    id: n.id,
    eventType: n.eventType,
    message: n.message,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <TechnicianDashboardClient
      technician={{
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      }}
      initialOrders={serializedOrders}
      initialInventory={serializedInventory}
      initialNotifications={serializedNotifications}
    />
  );
}

async function TechnicianDashboardAuthWrapper() {
  const session = await auth();

  if (
    !session?.user?.id ||
    ((session.user as any).role !== Role.TECHNICIAN && (session.user as any).role !== Role.ADMIN)
  ) {
    redirect("/login?callbackUrl=/technician/dashboard");
  }

  return (
    <TechnicianDashboardContent
      userId={session.user.id}
      userRole={(session.user as any).role as Role}
    />
  );
}

export default function TechnicianDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-semibold">Loading Technician Workbench...</p>
          </div>
        </div>
      }
    >
      <TechnicianDashboardAuthWrapper />
    </Suspense>
  );
}
