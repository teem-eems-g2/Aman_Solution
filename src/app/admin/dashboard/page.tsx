import React, { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import {
  AdminDashboardClient,
  SerializedAdminOrder,
  SerializedStaffMember,
  SerializedServiceItem,
  SerializedInventoryItem,
  SerializedPaymentRecord,
  SerializedAuditRecord,
  SerializedNotification,
} from "./admin-dashboard-client";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Operations Portal | Amanuel Mobile and Computer Maintenance",
  description:
    "Executive oversight dashboard for staff accounts, live service catalog, inventory stock, repair requests queue, and financial payments ledger.",
};

async function AdminDashboardContent({ userId }: { userId: string }) {
  const adminUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  if (!adminUser) {
    redirect("/login");
  }

  // 1. Query all repair orders across the company
  const rawOrders = await prisma.repairOrder.findMany({
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      device: true,
      service: true,
      assignedTech: { select: { id: true, name: true, email: true, phone: true } },
      quotations: {
        include: { items: true },
        orderBy: { version: "desc" },
      },
      repairParts: {
        include: { part: true },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
      updates: {
        include: {
          actor: { select: { name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const serializedOrders: SerializedAdminOrder[] = rawOrders.map((o) => ({
    id: o.id,
    referenceNumber: o.referenceNumber,
    customerId: o.customerId,
    customer: {
      id: o.customer.id,
      name: o.customer.name,
      email: o.customer.email,
      phone: o.customer.phone,
    },
    device: {
      id: o.device.id,
      category: o.device.category as SerializedAdminOrder["device"]["category"],
      brand: o.device.brand,
      model: o.device.model,
      serialNumber: o.device.serialNumber,
      photos: o.device.photos,
    },
    service: o.service
      ? {
          id: o.service.id,
          name: o.service.name,
          indicativePrice: o.service.indicativePrice.toString(),
        }
      : null,
    assignedTechId: o.assignedTechId,
    assignedTech: o.assignedTech
      ? {
          id: o.assignedTech.id,
          name: o.assignedTech.name,
          email: o.assignedTech.email,
          phone: o.assignedTech.phone,
        }
      : null,
    issueDescription: o.issueDescription,
    diagnosisNotes: o.diagnosisNotes,
    testingResults: o.testingResults,
    status: o.status as SerializedAdminOrder["status"],
    handoverConfirmedAt: o.handoverConfirmedAt ? o.handoverConfirmedAt.toISOString() : null,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    quotations: o.quotations.map((q) => ({
      id: q.id,
      version: q.version,
      totalAmount: q.totalAmount.toString(),
      currency: q.currency,
      status: q.status,
      isAdditionalWork: q.isAdditionalWork,
      validUntil: q.validUntil.toISOString(),
      items: q.items.map((it) => ({
        id: it.id,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice.toString(),
        lineTotal: it.lineTotal.toString(),
      })),
    })),
    repairParts: o.repairParts.map((rp) => ({
      id: rp.id,
      partId: rp.partId,
      quantityUsed: rp.quantityUsed,
      recordedUnitCost: rp.recordedUnitCost.toString(),
      part: {
        name: rp.part.name,
        sku: rp.part.sku,
      },
    })),
    payments: o.payments.map((p) => ({
      id: p.id,
      amount: p.amount.toString(),
      method: p.method,
      type: p.type,
      receiptNumber: p.receiptNumber,
      createdAt: p.createdAt.toISOString(),
    })),
    updates: o.updates.map((u) => ({
      id: u.id,
      previousStatus: u.previousStatus,
      newStatus: u.newStatus,
      notes: u.notes,
      createdAt: u.createdAt.toISOString(),
      actorName: u.actor.name,
      actorRole: u.actor.role,
    })),
  }));

  // 2. Query staff members
  const rawStaff = await prisma.user.findMany({
    where: { role: { in: [Role.TECHNICIAN, Role.ADMIN] } },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      _count: {
        select: { assignedRepairOrders: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedStaff: SerializedStaffMember[] = rawStaff.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    role: s.role as SerializedStaffMember["role"],
    status: s.status as SerializedStaffMember["status"],
    createdAt: s.createdAt.toISOString(),
    assignedOrdersCount: s._count.assignedRepairOrders,
  }));

  // 3. Query all services
  const rawServices = await prisma.service.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const serializedServices: SerializedServiceItem[] = rawServices.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    category: s.category as SerializedServiceItem["category"],
    indicativePrice: s.indicativePrice.toString(),
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
  }));

  // 4. Query all inventory parts
  const rawInventory = await prisma.inventoryPart.findMany({
    orderBy: { name: "asc" },
  });

  const serializedInventory: SerializedInventoryItem[] = rawInventory.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    quantity: p.quantity,
    reorderThreshold: p.reorderThreshold,
    unitCost: p.unitCost.toString(),
    isLowStock: p.quantity <= p.reorderThreshold,
    updatedAt: p.updatedAt.toISOString(),
  }));

  // 5. Query all payments
  const rawPayments = await prisma.payment.findMany({
    include: {
      recordedBy: { select: { name: true } },
      repairOrder: {
        select: {
          id: true,
          referenceNumber: true,
          customer: { select: { name: true, phone: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedPayments: SerializedPaymentRecord[] = rawPayments.map((p) => ({
    id: p.id,
    repairOrderId: p.repairOrderId,
    orderReference: p.repairOrder.referenceNumber,
    customerName: p.repairOrder.customer.name,
    customerPhone: p.repairOrder.customer.phone,
    amount: p.amount.toString(),
    method: p.method as SerializedPaymentRecord["method"],
    type: p.type as SerializedPaymentRecord["type"],
    reference: p.reference,
    receiptNumber: p.receiptNumber,
    recordedByName: p.recordedBy.name,
    createdAt: p.createdAt.toISOString(),
  }));

  // 6. Query system audit logs
  const rawAudit = await prisma.auditLog.findMany({
    include: {
      actor: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const serializedAuditLogs: SerializedAuditRecord[] = rawAudit.map((a) => ({
    id: a.id,
    action: a.action,
    entityType: a.entityType,
    entityId: a.entityId,
    actorName: a.actor.name,
    actorRole: a.actor.role,
    details: a.details,
    createdAt: a.createdAt.toISOString(),
  }));

  // 7. Query admin notifications
  const rawNotifications = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const serializedNotifications: SerializedNotification[] = rawNotifications.map((n) => ({
    id: n.id,
    eventType: n.eventType,
    message: n.message,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <AdminDashboardClient
      admin={{
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone,
        role: adminUser.role,
      }}
      initialOrders={serializedOrders}
      initialStaff={serializedStaff}
      initialServices={serializedServices}
      initialInventory={serializedInventory}
      initialPayments={serializedPayments}
      initialAuditLogs={serializedAuditLogs}
      initialNotifications={serializedNotifications}
    />
  );
}

async function AdminDashboardAuthWrapper() {
  await connection();
  const session = await auth();

  if (!session?.user?.id || (session.user as any).role !== Role.ADMIN) {
    redirect("/login?callbackUrl=/admin/dashboard");
  }

  return <AdminDashboardContent userId={session.user.id} />;
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-semibold">Loading Admin Operations Portal...</p>
          </div>
        </div>
      }
    >
      <AdminDashboardAuthWrapper />
    </Suspense>
  );
}
