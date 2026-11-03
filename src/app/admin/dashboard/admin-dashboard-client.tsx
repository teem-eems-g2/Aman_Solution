"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Wrench,
  Users,
  Package,
  Layers,
  CreditCard,
  BarChart3,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Bell,
  CheckCheck,
  TrendingUp,
  Receipt,
  UserCheck,
  UserX,
  RotateCcw,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Phone,
  Mail,
  ChevronRight,
  Maximize2,
  DollarSign,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList,
} from "lucide-react";

// Types
export interface SerializedAdminOrder {
  id: string;
  referenceNumber: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  device: {
    id: string;
    category: "MOBILE_PHONE" | "TABLET" | "LAPTOP" | "DESKTOP_COMPUTER";
    brand: string;
    model: string;
    serialNumber: string | null;
    photos: string[];
  };
  service: {
    id: string;
    name: string;
    indicativePrice: string;
  } | null;
  assignedTechId: string | null;
  assignedTech: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  issueDescription: string;
  diagnosisNotes: string | null;
  testingResults: string | null;
  status:
    | "SUBMITTED"
    | "ACCEPTED"
    | "REJECTED"
    | "NEEDS_CLARIFICATION"
    | "RECEIVED"
    | "DIAGNOSING"
    | "QUOTATION_PENDING"
    | "APPROVED"
    | "IN_REPAIR"
    | "TESTING"
    | "READY_FOR_COLLECTION"
    | "COMPLETED"
    | "CANCELLED";
  handoverConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  quotations: {
    id: string;
    version: number;
    totalAmount: string;
    currency: string;
    status: string;
    isAdditionalWork: boolean;
    validUntil: string;
    items: {
      id: string;
      description: string;
      quantity: number;
      unitPrice: string;
      lineTotal: string;
    }[];
  }[];
  repairParts: {
    id: string;
    partId: string;
    quantityUsed: number;
    recordedUnitCost: string;
    part: {
      name: string;
      sku: string;
    };
  }[];
  payments: {
    id: string;
    amount: string;
    method: string;
    type: string;
    receiptNumber: string;
    createdAt: string;
  }[];
  updates: {
    id: string;
    previousStatus: string | null;
    newStatus: string;
    notes: string;
    createdAt: string;
    actorName: string;
    actorRole: string;
  }[];
}

export interface SerializedStaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "TECHNICIAN";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
  assignedOrdersCount: number;
}

export interface SerializedServiceItem {
  id: string;
  name: string;
  description: string;
  category: "MOBILE_PHONE" | "TABLET" | "LAPTOP" | "DESKTOP_COMPUTER";
  indicativePrice: string;
  isActive: boolean;
  createdAt: string;
}

export interface SerializedInventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  reorderThreshold: number;
  unitCost: string;
  isLowStock: boolean;
  updatedAt: string;
}

export interface SerializedPaymentRecord {
  id: string;
  repairOrderId: string;
  orderReference: string;
  customerName: string;
  customerPhone: string;
  amount: string;
  method: "CASH" | "BANK_TRANSFER" | "MOBILE_MONEY";
  type: "DEPOSIT" | "PARTIAL" | "FINAL" | "REVERSAL";
  reference: string | null;
  receiptNumber: string;
  recordedByName: string;
  createdAt: string;
}

export interface SerializedAuditRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string;
  actorRole: string;
  details: any;
  createdAt: string;
}

export interface SerializedNotification {
  id: string;
  eventType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface AdminDashboardClientProps {
  admin: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  initialOrders: SerializedAdminOrder[];
  initialStaff: SerializedStaffMember[];
  initialServices: SerializedServiceItem[];
  initialInventory: SerializedInventoryItem[];
  initialPayments: SerializedPaymentRecord[];
  initialAuditLogs: SerializedAuditRecord[];
  initialNotifications: SerializedNotification[];
}

export function AdminDashboardClient({
  admin,
  initialOrders,
  initialStaff,
  initialServices,
  initialInventory,
  initialPayments,
  initialAuditLogs,
  initialNotifications,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Primary Data State
  const [orders, setOrders] = useState<SerializedAdminOrder[]>(initialOrders);
  const [staff, setStaff] = useState<SerializedStaffMember[]>(initialStaff);
  const [services, setServices] = useState<SerializedServiceItem[]>(initialServices);
  const [inventory, setInventory] = useState<SerializedInventoryItem[]>(initialInventory);
  const [payments, setPayments] = useState<SerializedPaymentRecord[]>(initialPayments);
  const [auditLogs] = useState<SerializedAuditRecord[]>(initialAuditLogs);
  const [notifications, setNotifications] = useState<SerializedNotification[]>(initialNotifications);
  const [showNotifications, setShowNotifications] = useState(false);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "staff" | "services" | "inventory" | "payments" | "audit"
  >("overview");

  // Notifications
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const markNotificationAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  // ==========================================
  // MODAL STATES
  // ==========================================
  // 1. Order Review & Tech Assignment Modal
  const [reviewOrder, setReviewOrder] = useState<SerializedAdminOrder | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"ACCEPTED" | "REJECTED" | "NEEDS_CLARIFICATION">("ACCEPTED");
  const [reviewTechId, setReviewTechId] = useState<string>("");
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 2. Staff Management Modals
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"TECHNICIAN" | "ADMIN">("TECHNICIAN");
  const [newStaffStatus, setNewStaffStatus] = useState<"ACTIVE" | "INACTIVE" | "SUSPENDED">("ACTIVE");
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [staffModalMessage, setStaffModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editingStaff, setEditingStaff] = useState<SerializedStaffMember | null>(null);
  const [editStaffRole, setEditStaffRole] = useState<"TECHNICIAN" | "ADMIN">("TECHNICIAN");
  const [editStaffStatus, setEditStaffStatus] = useState<"ACTIVE" | "INACTIVE" | "SUSPENDED">("ACTIVE");

  // 3. Service Catalog Modals
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<SerializedServiceItem | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [serviceCategory, setServiceCategory] = useState<"MOBILE_PHONE" | "TABLET" | "LAPTOP" | "DESKTOP_COMPUTER">("MOBILE_PHONE");
  const [servicePrice, setServicePrice] = useState<number>(500);
  const [serviceIsActive, setServiceIsActive] = useState(true);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [serviceModalMessage, setServiceModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 4. Inventory Part Modals
  const [showCreatePartModal, setShowCreatePartModal] = useState(false);
  const [editingPart, setEditingPart] = useState<SerializedInventoryItem | null>(null);
  const [partName, setPartName] = useState("");
  const [partSku, setPartSku] = useState("");
  const [partQuantity, setPartQuantity] = useState<number>(10);
  const [partReorder, setPartReorder] = useState<number>(5);
  const [partUnitCost, setPartUnitCost] = useState<number>(500);
  const [isSubmittingPart, setIsSubmittingPart] = useState(false);
  const [partModalMessage, setPartModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 5. Payment Modal
  const [showCreatePaymentModal, setShowCreatePaymentModal] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number>(500);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "MOBILE_MONEY">("CASH");
  const [paymentType, setPaymentType] = useState<"DEPOSIT" | "PARTIAL" | "FINAL" | "REVERSAL">("DEPOSIT");
  const [paymentReference, setPaymentReference] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentModalMessage, setPaymentModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Photo viewer modal
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Search & Filters
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryLowOnly, setInventoryLowOnly] = useState(false);

  // ==========================================
  // COMPUTED BUSINESS METRICS
  // ==========================================
  // Revenue
  const totalRevenueCollected = payments.reduce((acc, p) => {
    const val = Number(p.amount) || 0;
    return p.type === "REVERSAL" ? acc - val : acc + val;
  }, 0);

  // Approved Charges
  let totalApprovedCharges = 0;
  for (const o of orders) {
    const approvedQ = o.quotations.find((q) => q.status === "APPROVED");
    if (approvedQ) {
      totalApprovedCharges += Number(approvedQ.totalAmount) || 0;
    }
  }

  const outstandingBalance = Math.max(0, totalApprovedCharges - totalRevenueCollected);

  // Inventory Valuation
  const totalInventoryValue = inventory.reduce((acc, p) => {
    return acc + p.quantity * (Number(p.unitCost) || 0);
  }, 0);

  const lowStockCount = inventory.filter((p) => p.isLowStock).length;

  // Active Repairs
  const activeOrdersCount = orders.filter((o) =>
    ["SUBMITTED", "ACCEPTED", "RECEIVED", "DIAGNOSING", "QUOTATION_PENDING", "APPROVED", "IN_REPAIR", "TESTING", "READY_FOR_COLLECTION"].includes(
      o.status
    )
  ).length;

  const completedOrdersCount = orders.filter((o) => o.status === "COMPLETED").length;

  // Technicians list for assignment
  const activeTechnicians = staff.filter((s) => s.role === "TECHNICIAN" && s.status === "ACTIVE");

  // Helper for Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return { label: "Submitted", color: "bg-slate-100 text-slate-700 border-slate-200" };
      case "ACCEPTED":
        return { label: "Accepted", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "RECEIVED":
        return { label: "Device Received", color: "bg-sky-50 text-sky-700 border-sky-200" };
      case "DIAGNOSING":
        return { label: "Diagnosing", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "QUOTATION_PENDING":
        return { label: "Quotation Pending", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "APPROVED":
        return { label: "Customer Approved", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "IN_REPAIR":
        return { label: "In Repair", color: "bg-cyan-50 text-cyan-700 border-cyan-200" };
      case "TESTING":
        return { label: "Testing", color: "bg-orange-50 text-orange-700 border-orange-200" };
      case "READY_FOR_COLLECTION":
        return { label: "Ready for Pickup", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "COMPLETED":
        return { label: "Completed", color: "bg-green-50 text-green-700 border-green-200" };
      case "REJECTED":
        return { label: "Rejected", color: "bg-rose-50 text-rose-700 border-rose-200" };
      case "NEEDS_CLARIFICATION":
        return { label: "Needs Clarification", color: "bg-amber-100 text-amber-800 border-amber-300" };
      case "CANCELLED":
        return { label: "Cancelled", color: "bg-gray-100 text-gray-700 border-gray-300" };
      default:
        return { label: status, color: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  // ==========================================
  // HANDLERS
  // ==========================================
  // Review Order & Assign Tech
  const handleOpenReviewModal = (order: SerializedAdminOrder) => {
    setReviewOrder(order);
    setReviewStatus(
      order.status === "REJECTED" || order.status === "NEEDS_CLARIFICATION"
        ? order.status
        : "ACCEPTED"
    );
    setReviewTechId(order.assignedTechId || "");
    setReviewNotes(`Review and assignment for ${order.referenceNumber}`);
    setReviewMessage(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrder) return;
    if (!reviewNotes.trim()) {
      setReviewMessage({ type: "error", text: "Review notes are required." });
      return;
    }

    setIsSubmittingReview(true);
    setReviewMessage(null);

    try {
      const res = await fetch(`/api/repair-orders/${reviewOrder.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewStatus,
          assignedTechId: reviewTechId || null,
          notes: reviewNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update review status");
      }

      setReviewMessage({ type: "success", text: "Repair order review updated successfully." });

      // Update state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === reviewOrder.id
            ? {
                ...o,
                status: data.repairOrder.status,
                assignedTechId: data.repairOrder.assignedTechId,
                assignedTech: data.repairOrder.assignedTech,
                updatedAt: new Date().toISOString(),
                updates: [
                  {
                    id: `temp-${Date.now()}`,
                    previousStatus: o.status,
                    newStatus: data.repairOrder.status,
                    notes: reviewNotes.trim(),
                    createdAt: new Date().toISOString(),
                    actorName: admin.name,
                    actorRole: admin.role,
                  },
                  ...o.updates,
                ],
              }
            : o
        )
      );

      // Refresh technician counts
      setStaff((prev) =>
        prev.map((s) => {
          if (s.id === reviewTechId && s.id !== reviewOrder.assignedTechId) {
            return { ...s, assignedOrdersCount: s.assignedOrdersCount + 1 };
          }
          if (s.id === reviewOrder.assignedTechId && s.id !== reviewTechId) {
            return { ...s, assignedOrdersCount: Math.max(0, s.assignedOrdersCount - 1) };
          }
          return s;
        })
      );

      setTimeout(() => {
        setReviewOrder(null);
      }, 1000);

      startTransition(() => router.refresh());
    } catch (err: any) {
      setReviewMessage({ type: "error", text: err.message || "An unexpected error occurred" });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Staff Creation
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingStaff(true);
    setStaffModalMessage(null);

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStaffName.trim(),
          email: newStaffEmail.trim(),
          phone: newStaffPhone.trim(),
          password: newStaffPassword,
          role: newStaffRole,
          status: newStaffStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create staff member");
      }

      setStaffModalMessage({ type: "success", text: "Staff account created successfully!" });

      const newMember: SerializedStaffMember = {
        id: data.staff.id,
        name: data.staff.name,
        email: data.staff.email,
        phone: data.staff.phone,
        role: data.staff.role,
        status: data.staff.status,
        createdAt: data.staff.createdAt,
        assignedOrdersCount: 0,
      };

      setStaff((prev) => [newMember, ...prev]);

      // Reset
      setNewStaffName("");
      setNewStaffEmail("");
      setNewStaffPhone("");
      setNewStaffPassword("");

      setTimeout(() => {
        setShowCreateStaffModal(false);
      }, 1000);

      startTransition(() => router.refresh());
    } catch (err: any) {
      setStaffModalMessage({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  // Staff Update (Role / Status)
  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    if (editingStaff.id === admin.id && editStaffStatus !== "ACTIVE") {
      setStaffModalMessage({ type: "error", text: "Cannot deactivate or suspend your own admin account (BR-03)." });
      return;
    }

    setIsSubmittingStaff(true);
    setStaffModalMessage(null);

    try {
      const res = await fetch(`/api/admin/staff/${editingStaff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editStaffRole,
          status: editStaffStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update staff member");
      }

      setStaffModalMessage({ type: "success", text: "Staff account updated." });

      setStaff((prev) =>
        prev.map((s) =>
          s.id === editingStaff.id
            ? { ...s, role: data.staff.role, status: data.staff.status }
            : s
        )
      );

      setTimeout(() => {
        setEditingStaff(null);
      }, 1000);

      startTransition(() => router.refresh());
    } catch (err: any) {
      setStaffModalMessage({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  // Service Catalog Create / Edit / Toggle
  const handleToggleService = async (service: SerializedServiceItem) => {
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      const data = await res.json();
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, isActive: data.service.isActive } : s))
        );
        startTransition(() => router.refresh());
      }
    } catch (err) {
      console.error("Failed to toggle service", err);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingService(true);
    setServiceModalMessage(null);

    try {
      const isEditing = Boolean(editingService);
      const url = isEditing ? `/api/services/${editingService!.id}` : "/api/services";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: serviceName.trim(),
          description: serviceDesc.trim(),
          category: serviceCategory,
          indicativePrice: Number(servicePrice),
          isActive: serviceIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save service");
      }

      setServiceModalMessage({
        type: "success",
        text: isEditing ? "Service updated successfully" : "Service created successfully",
      });

      if (isEditing) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === editingService!.id
              ? {
                  ...s,
                  name: data.service.name,
                  description: data.service.description,
                  category: data.service.category,
                  indicativePrice: data.service.indicativePrice,
                  isActive: data.service.isActive,
                }
              : s
          )
        );
      } else {
        setServices((prev) => [
          {
            id: data.service.id,
            name: data.service.name,
            description: data.service.description,
            category: data.service.category,
            indicativePrice: data.service.indicativePrice,
            isActive: data.service.isActive,
            createdAt: data.service.createdAt,
          },
          ...prev,
        ]);
      }

      setTimeout(() => {
        setShowCreateServiceModal(false);
        setEditingService(null);
      }, 1000);

      startTransition(() => router.refresh());
    } catch (err: any) {
      setServiceModalMessage({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setIsSubmittingService(false);
    }
  };

  // Inventory Create / Edit
  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPart(true);
    setPartModalMessage(null);

    try {
      const isEditing = Boolean(editingPart);
      const url = isEditing ? `/api/inventory/${editingPart!.id}` : "/api/inventory";
      const method = isEditing ? "PATCH" : "POST";

      const payload = isEditing
        ? {
            name: partName.trim(),
            sku: partSku.trim().toUpperCase(),
            quantity: Number(partQuantity),
            reorderThreshold: Number(partReorder),
            unitCost: Number(partUnitCost),
          }
        : {
            name: partName.trim(),
            sku: partSku.trim().toUpperCase(),
            quantity: Number(partQuantity),
            reorderThreshold: Number(partReorder),
            unitCost: Number(partUnitCost),
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save part");
      }

      setPartModalMessage({
        type: "success",
        text: isEditing ? "Inventory part updated" : "Inventory part created",
      });

      const updatedOrNew: SerializedInventoryItem = {
        id: data.part.id,
        name: data.part.name,
        sku: data.part.sku,
        quantity: data.part.quantity,
        reorderThreshold: data.part.reorderThreshold,
        unitCost: data.part.unitCost,
        isLowStock: data.part.quantity <= data.part.reorderThreshold,
        updatedAt: new Date().toISOString(),
      };

      if (isEditing) {
        setInventory((prev) => prev.map((p) => (p.id === editingPart!.id ? updatedOrNew : p)));
      } else {
        setInventory((prev) => [updatedOrNew, ...prev]);
      }

      setTimeout(() => {
        setShowCreatePartModal(false);
        setEditingPart(null);
      }, 1000);

      startTransition(() => router.refresh());
    } catch (err: any) {
      setPartModalMessage({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setIsSubmittingPart(false);
    }
  };

  // Payments Recording
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentOrderId) {
      setPaymentModalMessage({ type: "error", text: "Please select a repair order." });
      return;
    }

    if (paymentType === "REVERSAL" && !paymentReference.trim()) {
      setPaymentModalMessage({ type: "error", text: "Reason/Reference is required for payment reversals (NFR-26)." });
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentModalMessage(null);

    try {
      const res = await fetch(`/api/repair-orders/${paymentOrderId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          method: paymentMethod,
          type: paymentType,
          reference: paymentReference.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      setPaymentModalMessage({
        type: "success",
        text: `Payment receipt ${data.payment.receiptNumber} recorded successfully (${data.payment.amount} ETB).`,
      });

      const targetOrder = orders.find((o) => o.id === paymentOrderId);

      const newRecord: SerializedPaymentRecord = {
        id: data.payment.id,
        repairOrderId: paymentOrderId,
        orderReference: targetOrder?.referenceNumber || "N/A",
        customerName: targetOrder?.customer.name || "Customer",
        customerPhone: targetOrder?.customer.phone || "",
        amount: data.payment.amount,
        method: data.payment.method,
        type: data.payment.type,
        reference: data.payment.reference,
        receiptNumber: data.payment.receiptNumber,
        recordedByName: admin.name,
        createdAt: data.payment.createdAt,
      };

      setPayments((prev) => [newRecord, ...prev]);

      setTimeout(() => {
        setShowCreatePaymentModal(false);
        setPaymentReference("");
      }, 1200);

      startTransition(() => router.refresh());
    } catch (err: any) {
      setPaymentModalMessage({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Header Bar */}
      <section className="bg-gradient-to-r from-[#0F294A] via-[#16365c] to-[#0F294A] text-white border-b border-slate-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wide uppercase">
                    Admin Operations Portal
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Full System Access
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                  Welcome, {admin.name}
                </h1>
                <p className="text-slate-300 text-sm mt-0.5 flex items-center gap-2">
                  <span>Amanuel Mobile and Computer Maintenance</span>
                  <span>•</span>
                  <span>Alamata Headquarters, Tigray, Ethiopia</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Center */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center shadow-md animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 text-slate-800 p-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-600" />
                        <h4 className="font-bold text-sm text-slate-800">Admin Alerts</h4>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} unread
                      </span>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 mt-2">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-sm text-slate-400">No system notifications.</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`py-3 px-2 rounded-lg transition-colors flex items-start justify-between gap-3 ${
                              n.isRead ? "opacity-70 bg-white" : "bg-blue-50/60 font-medium"
                            }`}
                          >
                            <div className="space-y-1 text-xs">
                              <p className="text-slate-800 leading-snug">{n.message}</p>
                              <span className="text-[10px] text-slate-400">
                                {new Date(n.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {!n.isRead && (
                              <button
                                onClick={() => markNotificationAsRead(n.id)}
                                title="Mark as read"
                                className="text-blue-600 hover:text-blue-800 p-1"
                              >
                                <CheckCheck className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Refresh Action */}
              <button
                onClick={() => {
                  startTransition(() => {
                    router.refresh();
                  });
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-md transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh Data</span>
              </button>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <span className="text-xs font-semibold text-emerald-200">Total Revenue Collected</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-300">
                  {totalRevenueCollected.toFixed(2)}
                </span>
                <span className="text-xs text-emerald-300 font-mono">ETB</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <span className="text-xs font-semibold text-blue-200">Active Repair Orders</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-300">{activeOrdersCount}</span>
                <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-md font-medium">In Flow</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <span className="text-xs font-semibold text-amber-200">Outstanding Balance</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl sm:text-2xl font-extrabold text-amber-300">
                  {outstandingBalance.toFixed(2)}
                </span>
                <span className="text-xs text-amber-300 font-mono">ETB</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <span className="text-xs font-semibold text-rose-200">Low Stock Parts Alert</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-rose-300">{lowStockCount}</span>
                <span className="text-xs text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-md font-medium">Needs Reorder</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between col-span-2 lg:col-span-1">
              <span className="text-xs font-semibold text-slate-200">Active Staff Accounts</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">{staff.length}</span>
                <span className="text-xs text-slate-300 bg-white/10 px-2 py-0.5 rounded-md font-medium">Team</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabbed Navigation */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs mb-8 overflow-hidden">
          <div className="flex items-center overflow-x-auto border-b border-slate-200 px-4 gap-2 bg-slate-50">
            {[
              { id: "overview", label: "Analytics & Overview", icon: BarChart3 },
              { id: "orders", label: `Repair Orders (${orders.length})`, icon: Wrench },
              { id: "staff", label: `Staff Accounts (${staff.length})`, icon: Users },
              { id: "services", label: `Service Catalog (${services.length})`, icon: Layers },
              { id: "inventory", label: `Inventory Stock (${inventory.length})`, icon: Package },
              { id: "payments", label: `Payments & Ledger (${payments.length})`, icon: CreditCard },
              { id: "audit", label: `System Audit Logs (${auditLogs.length})`, icon: ClipboardList },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-blue-600 text-blue-600 bg-white shadow-xs rounded-t-xl"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* ======================================================== */}
            {/* TAB 1: OVERVIEW & OPERATIONAL REPORTS (FR-55, FR-56)     */}
            {/* ======================================================== */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Orders by Status Pipeline */}
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" /> Repair Orders Pipeline Distribution (FR-55)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
                    {[
                      "SUBMITTED",
                      "ACCEPTED",
                      "DIAGNOSING",
                      "QUOTATION_PENDING",
                      "APPROVED",
                      "IN_REPAIR",
                      "READY_FOR_COLLECTION",
                      "COMPLETED",
                    ].map((st) => {
                      const count = orders.filter((o) => o.status === st).length;
                      const badge = getStatusBadge(st);
                      return (
                        <div key={st} className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <div className="text-2xl font-extrabold text-slate-800 mt-2">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Financial Breakdown & Inventory Asset Value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Financial Breakdown Card */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" /> Financial Performance Summary (FR-56)
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-600 font-medium">Total Approved Customer Charges:</span>
                        <span className="font-extrabold text-slate-900 font-mono">
                          {totalApprovedCharges.toFixed(2)} ETB
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <span className="text-emerald-800 font-medium">Total Net Revenue Collected:</span>
                        <span className="font-extrabold text-emerald-900 font-mono">
                          {totalRevenueCollected.toFixed(2)} ETB
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <span className="text-amber-800 font-medium">Outstanding Customer Balance:</span>
                        <span className="font-extrabold text-amber-900 font-mono">
                          {outstandingBalance.toFixed(2)} ETB
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inventory Stock Valuation Card */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" /> Inventory Valuation & Stock Health
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-600 font-medium">Total Catalog Stock Asset Value:</span>
                        <span className="font-extrabold text-blue-900 font-mono">
                          {totalInventoryValue.toFixed(2)} ETB
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-600 font-medium">Unique Spare Part SKUs:</span>
                        <span className="font-extrabold text-slate-900">{inventory.length} parts</span>
                      </div>
                      <div className="flex justify-between items-center text-sm p-3 bg-rose-50 rounded-xl border border-rose-200">
                        <span className="text-rose-800 font-medium">Parts at or below Reorder Threshold:</span>
                        <span className="font-extrabold text-rose-900">{lowStockCount} items</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technician Workload & Performance Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" /> Technician Assignment & Performance Overview
                  </h4>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <tr>
                          <th className="p-3.5">Technician Name</th>
                          <th className="p-3.5">Contact</th>
                          <th className="p-3.5 text-center">Status</th>
                          <th className="p-3.5 text-center">Total Assigned Jobs</th>
                          <th className="p-3.5 text-center">Active Jobs</th>
                          <th className="p-3.5 text-center">Completed Jobs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {staff
                          .filter((s) => s.role === "TECHNICIAN")
                          .map((tech) => {
                            const techOrders = orders.filter((o) => o.assignedTechId === tech.id);
                            const activeCount = techOrders.filter((o) =>
                              ["ACCEPTED", "DIAGNOSING", "APPROVED", "IN_REPAIR", "TESTING"].includes(o.status)
                            ).length;
                            const doneCount = techOrders.filter((o) => o.status === "COMPLETED").length;

                            return (
                              <tr key={tech.id} className="hover:bg-slate-50/50">
                                <td className="p-3.5 font-bold text-slate-800">{tech.name}</td>
                                <td className="p-3.5 text-slate-500">
                                  {tech.phone} • {tech.email}
                                </td>
                                <td className="p-3.5 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                      tech.status === "ACTIVE"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-rose-100 text-rose-800"
                                    }`}
                                  >
                                    {tech.status}
                                  </span>
                                </td>
                                <td className="p-3.5 text-center font-bold text-slate-800">{techOrders.length}</td>
                                <td className="p-3.5 text-center font-bold text-blue-600">{activeCount}</td>
                                <td className="p-3.5 text-center font-bold text-emerald-600">{doneCount}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: REPAIR ORDERS OVERSIGHT (FR-23, FR-34)            */}
            {/* ======================================================== */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="SUBMITTED">SUBMITTED (Needs Review)</option>
                      <option value="ACCEPTED">ACCEPTED</option>
                      <option value="DIAGNOSING">DIAGNOSING</option>
                      <option value="QUOTATION_PENDING">QUOTATION_PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="IN_REPAIR">IN_REPAIR</option>
                      <option value="READY_FOR_COLLECTION">READY_FOR_COLLECTION</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>

                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search ref, customer, phone, device..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                {/* Orders Oversight Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3.5">Reference & Date</th>
                        <th className="p-3.5">Customer</th>
                        <th className="p-3.5">Device</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Assigned Specialist</th>
                        <th className="p-3.5">Quotation / Balance</th>
                        <th className="p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders
                        .filter((order) => {
                          if (orderStatusFilter !== "ALL" && order.status !== orderStatusFilter) {
                            return false;
                          }
                          if (orderSearch.trim()) {
                            const q = orderSearch.toLowerCase().trim();
                            const mRef = order.referenceNumber.toLowerCase().includes(q);
                            const mCust =
                              order.customer.name.toLowerCase().includes(q) ||
                              order.customer.phone.includes(q);
                            const mDev =
                              order.device.brand.toLowerCase().includes(q) ||
                              order.device.model.toLowerCase().includes(q);
                            if (!mRef && !mCust && !mDev) return false;
                          }
                          return true;
                        })
                        .map((order) => {
                          const statusBadge = getStatusBadge(order.status);
                          const approvedQuote = order.quotations.find((q) => q.status === "APPROVED");

                          return (
                            <tr key={order.id} className="hover:bg-slate-50/50">
                              <td className="p-3.5">
                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {order.referenceNumber}
                                </span>
                                <div className="text-[10px] text-slate-400 mt-1">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </div>
                              </td>

                              <td className="p-3.5">
                                <div className="font-bold text-slate-800">{order.customer.name}</div>
                                <div className="text-[11px] text-slate-400">{order.customer.phone}</div>
                              </td>

                              <td className="p-3.5">
                                <div className="font-medium text-slate-800">
                                  {order.device.brand} {order.device.model}
                                </div>
                                <div className="text-[10px] text-slate-400">{order.device.category}</div>
                              </td>

                              <td className="p-3.5">
                                <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[10px] ${statusBadge.color}`}>
                                  {statusBadge.label}
                                </span>
                              </td>

                              <td className="p-3.5">
                                {order.assignedTech ? (
                                  <div className="font-medium text-blue-700 flex items-center gap-1">
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>{order.assignedTech.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-amber-600 font-semibold text-[11px] flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" /> Unassigned
                                  </span>
                                )}
                              </td>

                              <td className="p-3.5">
                                {approvedQuote ? (
                                  <div className="font-bold text-slate-800">
                                    {approvedQuote.totalAmount} ETB
                                    <span className="text-[10px] text-emerald-600 block">Approved</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">No approved quote</span>
                                )}
                              </td>

                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => handleOpenReviewModal(order)}
                                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                                >
                                  Review / Assign
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: STAFF MANAGEMENT (FR-07, BR-03)                   */}
            {/* ======================================================== */}
            {activeTab === "staff" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Staff Accounts Directory</h3>
                    <p className="text-xs text-slate-500">Manage internal technicians and administrators.</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateStaffModal(true);
                      setStaffModalMessage(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                  >
                    <Plus className="w-4 h-4" /> Add Staff Member
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3.5">Staff Name</th>
                        <th className="p-3.5">Email</th>
                        <th className="p-3.5">Phone</th>
                        <th className="p-3.5 text-center">System Role</th>
                        <th className="p-3.5 text-center">Account Status</th>
                        <th className="p-3.5 text-center">Assigned Jobs</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staff.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/50">
                          <td className="p-3.5 font-bold text-slate-800">
                            {member.name}
                            {member.id === admin.id && (
                              <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                                You
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-600">{member.email}</td>
                          <td className="p-3.5 text-slate-600">{member.phone}</td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                member.role === "ADMIN"
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : "bg-blue-100 text-blue-800 border border-blue-200"
                              }`}
                            >
                              {member.role}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                member.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : member.status === "SUSPENDED"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {member.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-800">
                            {member.assignedOrdersCount}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setEditingStaff(member);
                                setEditStaffRole(member.role);
                                setEditStaffStatus(member.status);
                                setStaffModalMessage(null);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold"
                            >
                              Edit Status/Role
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: SERVICE CATALOG CONFIGURATION (FR-15)             */}
            {/* ======================================================== */}
            {activeTab === "services" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Live Service Catalog Management</h3>
                    <p className="text-xs text-slate-500">Configure public repair offerings, prices, and activation.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingService(null);
                      setServiceName("");
                      setServiceDesc("");
                      setServiceCategory("MOBILE_PHONE");
                      setServicePrice(500);
                      setServiceIsActive(true);
                      setShowCreateServiceModal(true);
                      setServiceModalMessage(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                  >
                    <Plus className="w-4 h-4" /> Add New Service
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3.5">Service Name</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Description</th>
                        <th className="p-3.5 text-right">Indicative Price</th>
                        <th className="p-3.5 text-center">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {services.map((svc) => (
                        <tr key={svc.id} className="hover:bg-slate-50/50">
                          <td className="p-3.5 font-bold text-slate-800">{svc.name}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                              {svc.category.replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500 max-w-xs truncate">{svc.description}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                            {svc.indicativePrice} ETB
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleToggleService(svc)}
                              className={`px-2.5 py-1 rounded-full font-bold text-[10px] transition-colors ${
                                svc.isActive
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                            >
                              {svc.isActive ? "Active (Listed)" : "Inactive"}
                            </button>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setEditingService(svc);
                                setServiceName(svc.name);
                                setServiceDesc(svc.description);
                                setServiceCategory(svc.category);
                                setServicePrice(Number(svc.indicativePrice));
                                setServiceIsActive(svc.isActive);
                                setShowCreateServiceModal(true);
                                setServiceModalMessage(null);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 5: INVENTORY STOCK CONTROL (FR-42, FR-47)            */}
            {/* ======================================================== */}
            {activeTab === "inventory" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setInventoryLowOnly(!inventoryLowOnly)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        inventoryLowOnly
                          ? "bg-rose-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {inventoryLowOnly ? "Showing Low Stock Only" : "Filter Low Stock"}
                    </button>

                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search part name or SKU..."
                        value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingPart(null);
                      setPartName("");
                      setPartSku("");
                      setPartQuantity(10);
                      setPartReorder(5);
                      setPartUnitCost(500);
                      setShowCreatePartModal(true);
                      setPartModalMessage(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                  >
                    <Plus className="w-4 h-4" /> Add Inventory Part
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3.5">SKU & Part Name</th>
                        <th className="p-3.5 text-center">Stock Quantity</th>
                        <th className="p-3.5 text-center">Reorder Threshold</th>
                        <th className="p-3.5 text-right">Unit Cost</th>
                        <th className="p-3.5 text-right">Total Asset Valuation</th>
                        <th className="p-3.5 text-center">Health Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inventory
                        .filter((p) => {
                          if (inventoryLowOnly && !p.isLowStock) return false;
                          if (inventorySearch.trim()) {
                            const q = inventorySearch.toLowerCase().trim();
                            if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) {
                              return false;
                            }
                          }
                          return true;
                        })
                        .map((part) => (
                          <tr key={part.id} className="hover:bg-slate-50/50">
                            <td className="p-3.5">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {part.sku}
                              </span>
                              <div className="font-bold text-slate-800 mt-1">{part.name}</div>
                            </td>
                            <td className="p-3.5 text-center font-extrabold text-sm text-slate-800">
                              {part.quantity}
                            </td>
                            <td className="p-3.5 text-center font-medium text-slate-500">
                              {part.reorderThreshold}
                            </td>
                            <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                              {part.unitCost} ETB
                            </td>
                            <td className="p-3.5 text-right font-mono font-extrabold text-blue-900">
                              {(part.quantity * Number(part.unitCost)).toFixed(2)} ETB
                            </td>
                            <td className="p-3.5 text-center">
                              {part.isLowStock ? (
                                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800 flex items-center justify-center gap-1 mx-auto max-w-[110px]">
                                  <AlertTriangle className="w-3 h-3" /> Low Stock
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                                  Healthy
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => {
                                  setEditingPart(part);
                                  setPartName(part.name);
                                  setPartSku(part.sku);
                                  setPartQuantity(part.quantity);
                                  setPartReorder(part.reorderThreshold);
                                  setPartUnitCost(Number(part.unitCost));
                                  setShowCreatePartModal(true);
                                  setPartModalMessage(null);
                                }}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold"
                              >
                                Restock / Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 6: PAYMENTS & FINANCIAL LEDGER (FR-48, NFR-26)       */}
            {/* ======================================================== */}
            {activeTab === "payments" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Financial Ledger & Receipts</h3>
                    <p className="text-xs text-slate-500">Record payments, partial deposits, and reversals.</p>
                  </div>
                  <button
                    onClick={() => {
                      setPaymentOrderId(orders[0]?.id || "");
                      setPaymentAmount(500);
                      setPaymentMethod("CASH");
                      setPaymentType("DEPOSIT");
                      setPaymentReference("");
                      setShowCreatePaymentModal(true);
                      setPaymentModalMessage(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                  >
                    <Plus className="w-4 h-4" /> Record New Payment
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3.5">Receipt # & Date</th>
                        <th className="p-3.5">Order Reference</th>
                        <th className="p-3.5">Customer</th>
                        <th className="p-3.5">Method</th>
                        <th className="p-3.5 text-center">Transaction Type</th>
                        <th className="p-3.5 text-right">Amount (ETB)</th>
                        <th className="p-3.5">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => {
                        const isReversal = p.type === "REVERSAL";
                        return (
                          <tr key={p.id} className={`hover:bg-slate-50/50 ${isReversal ? "bg-rose-50/30" : ""}`}>
                            <td className="p-3.5">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {p.receiptNumber}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {new Date(p.createdAt).toLocaleString()}
                              </div>
                            </td>
                            <td className="p-3.5 font-mono font-medium text-blue-700">
                              {p.orderReference}
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-slate-800">{p.customerName}</div>
                              <div className="text-[10px] text-slate-400">{p.customerPhone}</div>
                            </td>
                            <td className="p-3.5 font-medium text-slate-700">
                              {p.method.replace("_", " ")}
                            </td>
                            <td className="p-3.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  isReversal
                                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                                    : p.type === "FINAL"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : "bg-blue-100 text-blue-800 border border-blue-200"
                                }`}
                              >
                                {p.type}
                              </span>
                            </td>
                            <td
                              className={`p-3.5 text-right font-mono font-extrabold text-sm ${
                                isReversal ? "text-rose-600" : "text-emerald-700"
                              }`}
                            >
                              {isReversal ? "-" : "+"}
                              {p.amount} ETB
                            </td>
                            <td className="p-3.5 text-slate-500">{p.recordedByName}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 7: AUDIT TRAIL LOGS (NFR-10)                         */}
            {/* ======================================================== */}
            {activeTab === "audit" && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800">Immutable System Audit Logs</h3>
                  <p className="text-xs text-slate-500">
                    Comprehensive chronological record of staff and administrative actions.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3.5">Timestamp</th>
                        <th className="p-3.5">Action</th>
                        <th className="p-3.5">Actor</th>
                        <th className="p-3.5">Entity</th>
                        <th className="p-3.5">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-800">{log.actorName}</span>
                            <span className="text-[10px] text-slate-400 block">({log.actorRole})</span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">
                            {log.entityType}
                          </td>
                          <td className="p-3.5 text-slate-500 font-mono text-[10px] max-w-xs truncate">
                            {JSON.stringify(log.details)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: ORDER REVIEW & TECHNICIAN ASSIGNMENT            */}
      {/* ======================================================== */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#0F294A] to-[#1a4175] text-white p-5 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-base">Review Repair Order</h4>
                <p className="text-xs text-slate-300 font-mono">{reviewOrder.referenceNumber}</p>
              </div>
              <button
                onClick={() => setReviewOrder(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              {reviewMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    reviewMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {reviewMessage.text}
                </div>
              )}

              {/* Order Info Summary */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div>
                  <strong>Customer:</strong> {reviewOrder.customer.name} ({reviewOrder.customer.phone})
                </div>
                <div>
                  <strong>Device:</strong> {reviewOrder.device.brand} {reviewOrder.device.model} ({reviewOrder.device.category})
                </div>
                <div>
                  <strong>Issue:</strong> {reviewOrder.issueDescription}
                </div>
              </div>

              {/* Status Decision */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Intake Review Decision <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
                >
                  <option value="ACCEPTED">ACCEPTED (Accept for Diagnosis & Repair)</option>
                  <option value="NEEDS_CLARIFICATION">NEEDS_CLARIFICATION (Hold for details)</option>
                  <option value="REJECTED">REJECTED (Decline Repair Request)</option>
                </select>
              </div>

              {/* Assign Technician */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Specialist Technician
                </label>
                <select
                  value={reviewTechId}
                  onChange={(e) => setReviewTechId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value="">-- Leave Unassigned --</option>
                  {activeTechnicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.phone}) — {t.assignedOrdersCount} active jobs
                    </option>
                  ))}
                </select>
              </div>

              {/* Review Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Review Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewOrder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                >
                  {isSubmittingReview ? "Saving..." : "Save Review Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CREATE / EDIT STAFF MEMBER                     */}
      {/* ======================================================== */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#0F294A] to-[#1a4175] text-white p-5 flex items-center justify-between">
              <h4 className="font-extrabold text-base">Create New Staff Member</h4>
              <button
                onClick={() => setShowCreateStaffModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
              {staffModalMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    staffModalMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {staffModalMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alula Gidey"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+251 9X XXX XXXX"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="staff@amanuelrepair.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password (min 8)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">System Role</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold"
                  >
                    <option value="TECHNICIAN">TECHNICIAN</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={newStaffStatus}
                    onChange={(e) => setNewStaffStatus(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateStaffModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStaff}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                >
                  {isSubmittingStaff ? "Creating..." : "Create Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#0F294A] to-[#1a4175] text-white p-5 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-base">Edit Staff Account</h4>
                <p className="text-xs text-slate-300">{editingStaff.name}</p>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="p-6 space-y-4">
              {staffModalMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    staffModalMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {staffModalMessage.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">System Role</label>
                <select
                  value={editStaffRole}
                  onChange={(e) => setEditStaffRole(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold"
                >
                  <option value="TECHNICIAN">TECHNICIAN</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                <select
                  value={editStaffStatus}
                  onChange={(e) => setEditStaffStatus(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStaff}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                >
                  {isSubmittingStaff ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CREATE / EDIT SERVICE CATALOG ITEM              */}
      {/* ======================================================== */}
      {showCreateServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#0F294A] to-[#1a4175] text-white p-5 flex items-center justify-between">
              <h4 className="font-extrabold text-base">
                {editingService ? "Edit Service" : "Add New Repair Service"}
              </h4>
              <button
                onClick={() => setShowCreateServiceModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4">
              {serviceModalMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    serviceModalMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {serviceModalMessage.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Battery Replacement & Health Calibration"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Device Category</label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold"
                  >
                    <option value="MOBILE_PHONE">MOBILE PHONE</option>
                    <option value="TABLET">TABLET</option>
                    <option value="LAPTOP">LAPTOP</option>
                    <option value="DESKTOP_COMPUTER">DESKTOP COMPUTER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Indicative Price (ETB)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={servicePrice}
                    onChange={(e) => setServicePrice(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed breakdown of work, diagnostics, parts included, and warranty period..."
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="serviceActive"
                  checked={serviceIsActive}
                  onChange={(e) => setServiceIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="serviceActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Publicly Active in Service Catalog
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateServiceModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingService}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                >
                  {isSubmittingService ? "Saving..." : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CREATE / EDIT INVENTORY SPARE PART              */}
      {/* ======================================================== */}
      {showCreatePartModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#0F294A] to-[#1a4175] text-white p-5 flex items-center justify-between">
              <h4 className="font-extrabold text-base">
                {editingPart ? "Restock / Edit Inventory Part" : "Add New Spare Part"}
              </h4>
              <button
                onClick={() => setShowCreatePartModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePart} className="p-6 space-y-4">
              {partModalMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    partModalMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {partModalMessage.text}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Part SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BATT-LI-4000"
                    value={partSku}
                    onChange={(e) => setPartSku(e.target.value.toUpperCase())}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Cost (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={1}
                    required
                    value={partUnitCost}
                    onChange={(e) => setPartUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Part Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard 4000mAh Li-ion Battery Pack"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Available Quantity</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={partQuantity}
                    onChange={(e) => setPartQuantity(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reorder Threshold</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={partReorder}
                    onChange={(e) => setPartReorder(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 text-center font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePartModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPart}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                >
                  {isSubmittingPart ? "Saving..." : "Save Part to Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: RECORD PAYMENT / REVERSAL                       */}
      {/* ======================================================== */}
      {showCreatePaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#0F294A] to-[#1a4175] text-white p-5 flex items-center justify-between">
              <h4 className="font-extrabold text-base">Record Payment / Reversal</h4>
              <button
                onClick={() => setShowCreatePaymentModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {paymentModalMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    paymentModalMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {paymentModalMessage.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Repair Order <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={paymentOrderId}
                  onChange={(e) => setPaymentOrderId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-medium"
                >
                  <option value="">-- Select Repair Order --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      [{o.referenceNumber}] {o.customer.name} — {o.device.brand} {o.device.model} ({o.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={1}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER (CBE / Telebirr)</option>
                    <option value="MOBILE_MONEY">MOBILE MONEY</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Type</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold"
                >
                  <option value="DEPOSIT">DEPOSIT (Advance Payment)</option>
                  <option value="PARTIAL">PARTIAL (Installment)</option>
                  <option value="FINAL">FINAL (Settlement on Handover)</option>
                  <option value="REVERSAL">REVERSAL (Accounting Correction)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reference / Reason {paymentType === "REVERSAL" && <span className="text-rose-500">* (NFR-26)</span>}
                </label>
                <input
                  type="text"
                  required={paymentType === "REVERSAL"}
                  placeholder={
                    paymentType === "REVERSAL"
                      ? "Mandatory reason for reversal (e.g. duplicate charge entry)"
                      : "Bank slip number, Telebirr txn ID, or notes"
                  }
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePaymentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                >
                  {isSubmittingPayment ? "Generating Receipt..." : "Record Payment & Issue Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
