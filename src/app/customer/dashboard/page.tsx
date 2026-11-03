import React, { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import {
  CustomerDashboardClient,
  SerializedDevice,
  SerializedRepairOrder,
  SerializedServiceOption,
  SerializedNotification,
} from "./customer-dashboard-client";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Customer Dashboard | Amanuel Mobile and Computer Maintenance",
  description:
    "Track repair orders, review transparent quotations, manage registered devices, and schedule appointments.",
};

async function CustomerDashboardContent({ userId }: { userId: string }) {
  // Query customer profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true },
  });

  if (!user) {
    redirect("/login");
  }

  // 1. Query registered devices
  const rawDevices = await prisma.device.findMany({
    where: { customerId: userId },
    include: {
      _count: {
        select: { repairOrders: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedDevices: SerializedDevice[] = rawDevices.map((d) => ({
    id: d.id,
    category: d.category as SerializedDevice["category"],
    brand: d.brand,
    model: d.model,
    serialNumber: d.serialNumber,
    photos: d.photos,
    createdAt: d.createdAt.toISOString(),
    repairOrdersCount: d._count.repairOrders,
  }));

  // 2. Query repair orders with full details, updates, quotations, and payments
  const rawOrders = await prisma.repairOrder.findMany({
    where: { customerId: userId },
    include: {
      device: true,
      service: true,
      assignedTech: {
        select: { id: true, name: true, phone: true },
      },
      quotations: {
        include: { items: true },
        orderBy: { version: "desc" },
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
    orderBy: { createdAt: "desc" },
  });

  const serializedOrders: SerializedRepairOrder[] = rawOrders.map((order) => ({
    id: order.id,
    referenceNumber: order.referenceNumber,
    status: order.status,
    issueDescription: order.issueDescription,
    diagnosisNotes: order.diagnosisNotes,
    testingResults: order.testingResults,
    createdAt: order.createdAt.toISOString(),
    device: {
      id: order.device.id,
      category: order.device.category as SerializedDevice["category"],
      brand: order.device.brand,
      model: order.device.model,
      serialNumber: order.device.serialNumber,
    },
    service: order.service
      ? {
          id: order.service.id,
          name: order.service.name,
          indicativePrice: order.service.indicativePrice.toString(),
        }
      : null,
    assignedTech: order.assignedTech
      ? {
          id: order.assignedTech.id,
          name: order.assignedTech.name,
          phone: order.assignedTech.phone,
        }
      : null,
    quotations: order.quotations.map((q) => ({
      id: q.id,
      version: q.version,
      totalAmount: q.totalAmount.toString(),
      currency: q.currency,
      validUntil: q.validUntil.toISOString(),
      status: q.status as SerializedRepairOrder["quotations"][number]["status"],
      isAdditionalWork: q.isAdditionalWork,
      decisionAt: q.decisionAt ? q.decisionAt.toISOString() : null,
      items: q.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        lineTotal: item.lineTotal.toString(),
      })),
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

  // 3. Query active services for booking wizard
  const rawServices = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const serializedServices: SerializedServiceOption[] = rawServices.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category as SerializedServiceOption["category"],
    indicativePrice: s.indicativePrice.toString(),
  }));

  // 4. Query customer notifications
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
    <CustomerDashboardClient
      customer={user}
      initialDevices={serializedDevices}
      initialOrders={serializedOrders}
      services={serializedServices}
      initialNotifications={serializedNotifications}
    />
  );
}

async function DashboardAuthWrapper() {
  // Server-side session verification (NFR-04, NFR-05)
  const session = await auth();

  if (!session?.user?.id || (session.user as any).role !== Role.CUSTOMER) {
    redirect("/login?callbackUrl=/customer/dashboard");
  }

  return <CustomerDashboardContent userId={session.user.id} />;
}

export default function CustomerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-semibold">Loading Customer Dashboard...</p>
          </div>
        </div>
      }
    >
      <DashboardAuthWrapper />
    </Suspense>
  );
}
