"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Cpu,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  X,
  Plus,
  Trash2,
  FileText,
  Check,
  PackageCheck,
  PackageMinus,
  User,
  Phone,
  Mail,
  Layers,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  Bell,
  CheckCheck,
  Camera,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
} from "lucide-react";

export interface SerializedQuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface SerializedQuotation {
  id: string;
  version: number;
  totalAmount: string;
  currency: string;
  validUntil: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "SUPERSEDED";
  isAdditionalWork: boolean;
  decisionAt: string | null;
  createdAt: string;
  items: SerializedQuotationItem[];
}

export interface SerializedConsumedPart {
  id: string;
  partId: string;
  quantityUsed: number;
  recordedUnitCost: string;
  createdAt: string;
  part: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    reorderThreshold: number;
    unitCost: string;
  };
}

export interface SerializedRepairUpdate {
  id: string;
  previousStatus: string | null;
  newStatus: string;
  notes: string;
  createdAt: string;
  actorName: string;
  actorRole: string;
}

export interface SerializedTechnicianOrder {
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
  quotations: SerializedQuotation[];
  repairParts: SerializedConsumedPart[];
  updates: SerializedRepairUpdate[];
  appointments: {
    id: string;
    scheduledStart: string;
    scheduledEnd: string;
    status: string;
    notes: string | null;
  }[];
  payments: {
    id: string;
    amount: string;
    method: string;
    type: string;
    receiptNumber: string;
    createdAt: string;
  }[];
}

export interface SerializedInventoryPart {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  reorderThreshold: number;
  unitCost: string;
  isLowStock: boolean;
}

export interface SerializedTechnicianUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface SerializedNotification {
  id: string;
  eventType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface TechnicianDashboardClientProps {
  technician: SerializedTechnicianUser;
  initialOrders: SerializedTechnicianOrder[];
  initialInventory: SerializedInventoryPart[];
  initialNotifications: SerializedNotification[];
}

export function TechnicianDashboardClient({
  technician,
  initialOrders,
  initialInventory,
  initialNotifications,
}: TechnicianDashboardClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [orders, setOrders] = useState<SerializedTechnicianOrder[]>(initialOrders);
  const [inventory, setInventory] = useState<SerializedInventoryPart[]>(initialInventory);
  const [notifications, setNotifications] = useState<SerializedNotification[]>(initialNotifications);
  const [showNotifications, setShowNotifications] = useState(false);

  // Selected Order for Modal / Workbench Drawer
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<
    "overview" | "diagnosis" | "quotation" | "parts" | "status" | "timeline"
  >("overview");

  // Filtering & Search state
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sub-forms local states for selected order
  // 1. Diagnosis
  const [diagNotesInput, setDiagNotesInput] = useState<string>("");
  const [diagStatusInput, setDiagStatusInput] = useState<"DIAGNOSING" | "RECEIVED">("DIAGNOSING");
  const [isSubmittingDiag, setIsSubmittingDiag] = useState(false);
  const [diagMessage, setDiagMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 2. Quotation Builder
  const [quoteItems, setQuoteItems] = useState<{ description: string; quantity: number; unitPrice: number }[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [quoteValidDays, setQuoteValidDays] = useState<number>(14);
  const [quoteIsAdditional, setQuoteIsAdditional] = useState<boolean>(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 3. Parts Consumption
  const [selectedPartId, setSelectedPartId] = useState<string>("");
  const [partQtyToConsume, setPartQtyToConsume] = useState<number>(1);
  const [isSubmittingPart, setIsSubmittingPart] = useState(false);
  const [partMessage, setPartMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 4. Status Progression
  const [progNewStatus, setProgNewStatus] = useState<string>("");
  const [progNotes, setProgNotes] = useState<string>("");
  const [progTestingResults, setProgTestingResults] = useState<string>("");
  const [progHandoverConfirmed, setProgHandoverConfirmed] = useState<boolean>(false);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Photo viewer modal
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Active Selected Order
  const activeOrder = orders.find((o) => o.id === selectedOrderId) || null;

  // Unread notifications count
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

  // Helper for Device Icon
  const getDeviceIcon = (category: string) => {
    switch (category) {
      case "MOBILE_PHONE":
        return <Smartphone className="w-5 h-5 text-blue-600" />;
      case "TABLET":
        return <Tablet className="w-5 h-5 text-indigo-600" />;
      case "LAPTOP":
        return <Laptop className="w-5 h-5 text-violet-600" />;
      case "DESKTOP_COMPUTER":
        return <Monitor className="w-5 h-5 text-cyan-600" />;
      default:
        return <Wrench className="w-5 h-5 text-blue-600" />;
    }
  };

  // Status Badge Helper
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
        return { label: "Quality Testing", color: "bg-orange-50 text-orange-700 border-orange-200" };
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

  // Open Order Drawer
  const openOrderDrawer = (order: SerializedTechnicianOrder, defaultTab: typeof activeDrawerTab = "overview") => {
    setSelectedOrderId(order.id);
    setActiveDrawerTab(defaultTab);
    setDiagNotesInput("");
    setDiagMessage(null);
    setQuoteMessage(null);
    setPartMessage(null);
    setStatusMessage(null);
    setProgNotes("");
    setProgTestingResults(order.testingResults || "");
    setProgHandoverConfirmed(Boolean(order.handoverConfirmedAt));
    setProgNewStatus("");
  };

  // Metric calculation
  const totalAssigned = orders.length;
  const pendingDiagnosisCount = orders.filter((o) =>
    ["ACCEPTED", "RECEIVED", "DIAGNOSING"].includes(o.status)
  ).length;
  const activeRepairCount = orders.filter((o) =>
    ["APPROVED", "IN_REPAIR", "TESTING"].includes(o.status)
  ).length;
  const quotationPendingCount = orders.filter((o) => o.status === "QUOTATION_PENDING").length;
  const readyOrDoneCount = orders.filter((o) =>
    ["READY_FOR_COLLECTION", "COMPLETED"].includes(o.status)
  ).length;

  // Filtered orders list
  const filteredOrders = orders.filter((order) => {
    // Tab filter
    if (statusFilter === "NEEDS_DIAGNOSIS") {
      if (!["ACCEPTED", "RECEIVED", "DIAGNOSING"].includes(order.status)) return false;
    } else if (statusFilter === "QUOTATION_PENDING") {
      if (order.status !== "QUOTATION_PENDING") return false;
    } else if (statusFilter === "IN_REPAIR") {
      if (!["APPROVED", "IN_REPAIR", "TESTING"].includes(order.status)) return false;
    } else if (statusFilter === "READY_OR_DONE") {
      if (!["READY_FOR_COLLECTION", "COMPLETED"].includes(order.status)) return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchRef = order.referenceNumber.toLowerCase().includes(q);
      const matchCustomer = order.customer.name.toLowerCase().includes(q) || order.customer.phone.includes(q);
      const matchDevice =
        order.device.brand.toLowerCase().includes(q) ||
        order.device.model.toLowerCase().includes(q) ||
        (order.device.serialNumber && order.device.serialNumber.toLowerCase().includes(q));
      if (!matchRef && !matchCustomer && !matchDevice) return false;
    }

    return true;
  });

  // Action 1: Record Diagnosis
  const handleRecordDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    if (!diagNotesInput.trim()) {
      setDiagMessage({ type: "error", text: "Diagnosis notes are required." });
      return;
    }

    setIsSubmittingDiag(true);
    setDiagMessage(null);

    try {
      const res = await fetch(`/api/repair-orders/${activeOrder.id}/diagnosis`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosisNotes: diagNotesInput.trim(),
          status: diagStatusInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record diagnosis");
      }

      setDiagMessage({ type: "success", text: "Diagnosis notes saved successfully." });
      setDiagNotesInput("");

      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === activeOrder.id
            ? {
                ...o,
                diagnosisNotes: data.repairOrder.diagnosisNotes,
                status: data.repairOrder.status,
                updatedAt: new Date().toISOString(),
                updates: [
                  {
                    id: `temp-${Date.now()}`,
                    previousStatus: o.status,
                    newStatus: data.repairOrder.status,
                    notes: diagNotesInput.trim(),
                    createdAt: new Date().toISOString(),
                    actorName: technician.name,
                    actorRole: technician.role,
                  },
                  ...o.updates,
                ],
              }
            : o
        )
      );

      startTransition(() => router.refresh());
    } catch (err: any) {
      setDiagMessage({ type: "error", text: err.message || "An unexpected error occurred" });
    } finally {
      setIsSubmittingDiag(false);
    }
  };

  // Action 2: Quotation Builder
  const handleAddQuoteItem = () => {
    setQuoteItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveQuoteItem = (index: number) => {
    if (quoteItems.length === 1) return;
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuoteItemChange = (index: number, field: string, value: any) => {
    setQuoteItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSelectInventoryForQuote = (index: number, partId: string) => {
    const part = inventory.find((p) => p.id === partId);
    if (!part) return;
    setQuoteItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              description: `Replacement Part: ${part.name} (SKU: ${part.sku})`,
              unitPrice: Number(part.unitCost),
            }
          : item
      )
    );
  };

  const quoteTotalETB = quoteItems.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return acc + qty * price;
  }, 0);

  const handleSubmitQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    // Validate items
    for (const item of quoteItems) {
      if (!item.description.trim()) {
        setQuoteMessage({ type: "error", text: "Every line item must have a description." });
        return;
      }
      if (Number(item.quantity) < 1) {
        setQuoteMessage({ type: "error", text: "Quantity must be at least 1." });
        return;
      }
      if (Number(item.unitPrice) <= 0) {
        setQuoteMessage({ type: "error", text: "Unit price must be positive." });
        return;
      }
    }

    setIsSubmittingQuote(true);
    setQuoteMessage(null);

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + Number(quoteValidDays));

    try {
      const res = await fetch(`/api/repair-orders/${activeOrder.id}/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: quoteItems.map((item) => ({
            description: item.description.trim(),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })),
          validUntil: validUntilDate.toISOString(),
          currency: "ETB",
          isAdditionalWork: quoteIsAdditional,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit quotation");
      }

      setQuoteMessage({
        type: "success",
        text: `Quotation v${data.quotation.version} created and sent to customer (${data.quotation.totalAmount} ETB).`,
      });

      // Reset form
      setQuoteItems([{ description: "", quantity: 1, unitPrice: 0 }]);

      // Update local state
      const serializedNewQuote: SerializedQuotation = {
        id: data.quotation.id,
        version: data.quotation.version,
        totalAmount: data.quotation.totalAmount,
        currency: data.quotation.currency,
        validUntil: data.quotation.validUntil,
        status: data.quotation.status,
        isAdditionalWork: data.quotation.isAdditionalWork,
        decisionAt: data.quotation.decisionAt,
        createdAt: data.quotation.createdAt,
        items: data.quotation.items.map((it: any) => ({
          id: it.id,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          lineTotal: it.lineTotal,
        })),
      };

      setOrders((prev) =>
        prev.map((o) =>
          o.id === activeOrder.id
            ? {
                ...o,
                status: "QUOTATION_PENDING",
                quotations: [serializedNewQuote, ...o.quotations],
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );

      startTransition(() => router.refresh());
    } catch (err: any) {
      setQuoteMessage({ type: "error", text: err.message || "An unexpected error occurred" });
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // Action 3: Parts Consumption Tool
  const handleConsumePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    if (!selectedPartId) {
      setPartMessage({ type: "error", text: "Please select an inventory part." });
      return;
    }

    const selectedInvPart = inventory.find((p) => p.id === selectedPartId);
    if (!selectedInvPart) {
      setPartMessage({ type: "error", text: "Selected part not found." });
      return;
    }

    if (partQtyToConsume < 1) {
      setPartMessage({ type: "error", text: "Quantity must be at least 1." });
      return;
    }

    if (partQtyToConsume > selectedInvPart.quantity) {
      setPartMessage({
        type: "error",
        text: `Cannot consume ${partQtyToConsume} units. Only ${selectedInvPart.quantity} units in stock.`,
      });
      return;
    }

    setIsSubmittingPart(true);
    setPartMessage(null);

    try {
      const res = await fetch(`/api/repair-orders/${activeOrder.id}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId: selectedPartId,
          quantityUsed: Number(partQtyToConsume),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to consume repair part");
      }

      setPartMessage({
        type: "success",
        text: `Successfully logged ${partQtyToConsume}x ${selectedInvPart.name} to this repair order. Stock deducted.`,
      });

      // Update inventory local state
      setInventory((prev) =>
        prev.map((p) =>
          p.id === selectedPartId
            ? {
                ...p,
                quantity: data.inventoryPart.quantity,
                isLowStock: data.inventoryPart.isLowStock,
              }
            : p
        )
      );

      // Update order's repair parts list
      const newRepairPart: SerializedConsumedPart = {
        id: data.repairPart.id,
        partId: data.repairPart.partId,
        quantityUsed: data.repairPart.quantityUsed,
        recordedUnitCost: data.repairPart.recordedUnitCost,
        createdAt: data.repairPart.createdAt,
        part: {
          id: selectedInvPart.id,
          name: selectedInvPart.name,
          sku: selectedInvPart.sku,
          quantity: data.inventoryPart.quantity,
          reorderThreshold: selectedInvPart.reorderThreshold,
          unitCost: selectedInvPart.unitCost,
        },
      };

      setOrders((prev) =>
        prev.map((o) =>
          o.id === activeOrder.id
            ? {
                ...o,
                repairParts: [newRepairPart, ...o.repairParts],
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );

      setSelectedPartId("");
      setPartQtyToConsume(1);
      startTransition(() => router.refresh());
    } catch (err: any) {
      setPartMessage({ type: "error", text: err.message || "An unexpected error occurred" });
    } finally {
      setIsSubmittingPart(false);
    }
  };

  // Action 4: Workflow Status Progression
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    if (!progNewStatus) {
      setStatusMessage({ type: "error", text: "Please select a target status." });
      return;
    }

    if (!progNotes.trim()) {
      setStatusMessage({ type: "error", text: "Technician status notes are required (FR-35)." });
      return;
    }

    if (progNewStatus === "READY_FOR_COLLECTION") {
      if (!progTestingResults.trim()) {
        setStatusMessage({
          type: "error",
          text: "Quality testing results are required before marking order Ready for Pickup (FR-39).",
        });
        return;
      }
    }

    if (progNewStatus === "COMPLETED") {
      if (!progHandoverConfirmed && !activeOrder.handoverConfirmedAt) {
        setStatusMessage({
          type: "error",
          text: "You must confirm that physical device handover occurred (BR-09, FR-41).",
        });
        return;
      }
    }

    setIsSubmittingStatus(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/repair-orders/${activeOrder.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus: progNewStatus,
          notes: progNotes.trim(),
          testingResults: progTestingResults.trim() || undefined,
          handoverConfirmed: progHandoverConfirmed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update workflow status");
      }

      setStatusMessage({
        type: "success",
        text: `Order status successfully transitioned to ${progNewStatus}.`,
      });

      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === activeOrder.id
            ? {
                ...o,
                status: data.repairOrder.status,
                testingResults: data.repairOrder.testingResults || o.testingResults,
                handoverConfirmedAt: data.repairOrder.handoverConfirmedAt || o.handoverConfirmedAt,
                updatedAt: new Date().toISOString(),
                updates: [
                  {
                    id: `temp-${Date.now()}`,
                    previousStatus: o.status,
                    newStatus: data.repairOrder.status,
                    notes: progNotes.trim(),
                    createdAt: new Date().toISOString(),
                    actorName: technician.name,
                    actorRole: technician.role,
                  },
                  ...o.updates,
                ],
              }
            : o
        )
      );

      setProgNotes("");
      setProgNewStatus("");
      startTransition(() => router.refresh());
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An unexpected error occurred" });
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Check if active order has an approved quotation
  const hasApprovedQuote = activeOrder?.quotations.some((q) => q.status === "APPROVED");
  const hasPendingQuote = activeOrder?.quotations.some((q) => q.status === "PENDING");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Header Bar */}
      <section className="bg-gradient-to-r from-[#0F294A] via-[#16365c] to-[#0F294A] text-white border-b border-slate-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-inner">
                <Wrench className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 tracking-wide uppercase">
                    Technician Workbench
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Authorized Specialist
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                  Welcome, {technician.name}
                </h1>
                <p className="text-slate-300 text-sm mt-0.5 flex items-center gap-2">
                  <span>Alamata Central Lab, Tigray, Ethiopia</span>
                  <span>•</span>
                  <span>Staff ID: {technician.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Bell */}
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

                {/* Notifications Popup */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 text-slate-800 p-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-600" />
                        <h4 className="font-bold text-sm text-slate-800">Job Notifications</h4>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} unread
                      </span>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 mt-2">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-sm text-slate-400">No notifications yet.</p>
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
                <span className="hidden sm:inline">Refresh Queue</span>
              </button>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-300">Total Assigned</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">{totalAssigned}</span>
                <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-md font-medium">Jobs</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <span className="text-xs font-semibold text-amber-200">Pending Diagnosis</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-300">{pendingDiagnosisCount}</span>
                <span className="text-xs text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md font-medium">Needs Diag</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <span className="text-xs font-semibold text-purple-200">Quotation Pending</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-purple-300">{quotationPendingCount}</span>
                <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md font-medium">Awaiting Cust</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <span className="text-xs font-semibold text-cyan-200">Active In Repair</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-cyan-300">{activeRepairCount}</span>
                <span className="text-xs text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-md font-medium">Bench Work</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between col-span-2 lg:col-span-1">
              <span className="text-xs font-semibold text-emerald-200">Ready / Done</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-300">{readyOrDoneCount}</span>
                <span className="text-xs text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md font-medium">Finished</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
              {[
                { key: "ALL", label: `All Jobs (${orders.length})` },
                { key: "NEEDS_DIAGNOSIS", label: `Needs Diagnosis (${pendingDiagnosisCount})` },
                { key: "QUOTATION_PENDING", label: `Quotation Pending (${quotationPendingCount})` },
                { key: "IN_REPAIR", label: `In Repair (${activeRepairCount})` },
                { key: "READY_OR_DONE", label: `Ready/Done (${readyOrDoneCount})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    statusFilter === tab.key
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reference, customer, phone, device..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Jobs Queue Cards */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Repair Orders Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              There are currently no repair orders matching your filter criteria. Clear filters or check back when new jobs are assigned.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order) => {
              const statusBadge = getStatusBadge(order.status);
              const latestQuote = order.quotations[0] || null;
              const consumedCount = order.repairParts.length;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Left Column: Reference, Device & Customer info */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-sm font-extrabold text-[#0F294A] bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                        {order.referenceNumber}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusBadge.color}`}
                      >
                        {statusBadge.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        Updated: {new Date(order.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(order.device.category)}
                        <span className="font-bold text-slate-800">
                          {order.device.brand} {order.device.model}
                        </span>
                        {order.device.serialNumber && (
                          <span className="text-xs text-slate-400 font-mono">
                            (S/N: {order.device.serialNumber})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600 sm:border-l sm:border-slate-200 sm:pl-4">
                        <span className="flex items-center gap-1 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {order.customer.name}
                        </span>
                        <a
                          href={`tel:${order.customer.phone}`}
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {order.customer.phone}
                        </a>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-700">Reported Issue: </span>
                      {order.issueDescription}
                    </p>
                  </div>

                  {/* Middle Column: Quotation and Parts Overview */}
                  <div className="flex flex-wrap lg:flex-col items-start lg:items-end justify-between gap-2 text-xs border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 lg:min-w-[200px]">
                    {latestQuote ? (
                      <div className="text-left lg:text-right">
                        <span className="text-slate-400">Latest Quotation:</span>
                        <div className="flex items-center lg:justify-end gap-1 font-bold text-slate-800 mt-0.5">
                          <span>
                            {latestQuote.totalAmount} {latestQuote.currency}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              latestQuote.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : latestQuote.status === "PENDING"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            v{latestQuote.version} {latestQuote.status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No quotation generated</span>
                    )}

                    <div className="text-left lg:text-right text-slate-500 flex items-center gap-1.5">
                      <PackageCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{consumedCount} parts consumed</span>
                    </div>

                    {order.diagnosisNotes && (
                      <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Diagnosis recorded
                      </span>
                    )}
                  </div>

                  {/* Right Column: Manage Workbench Action */}
                  <div className="flex items-center gap-2 pt-2 lg:pt-0">
                    <button
                      onClick={() => openOrderDrawer(order, "overview")}
                      className="w-full lg:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/10 transition-all hover:scale-[1.02]"
                    >
                      <Wrench className="w-4 h-4" />
                      <span>Manage Workbench</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* WORKBENCH DRAWER / MODAL FOR SELECTED ORDER             */}
      {/* ======================================================== */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0F294A] to-[#1a4175] text-white p-5 sm:p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-white">
                      {activeOrder.referenceNumber}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        getStatusBadge(activeOrder.status).color
                      }`}
                    >
                      {getStatusBadge(activeOrder.status).label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Customer: <span className="font-bold text-white">{activeOrder.customer.name}</span> ({activeOrder.customer.phone}) • {activeOrder.device.brand} {activeOrder.device.model}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrderId(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50 overflow-x-auto gap-2">
              {[
                { id: "overview", label: "Overview & Device", icon: Eye },
                { id: "diagnosis", label: "Diagnosis Form", icon: FileText },
                { id: "quotation", label: "Quotation Builder", icon: DollarSign },
                { id: "parts", label: "Part Consumption", icon: PackageMinus },
                { id: "status", label: "Workflow Controller", icon: SlidersHorizontal },
                { id: "timeline", label: "Timeline Log", icon: Clock },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeDrawerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDrawerTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                      isActive
                        ? "border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-xs"
                        : "border-transparent text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body / Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: OVERVIEW & DEVICE DETAILS */}
              {activeDrawerTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Information Card */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" /> Customer Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Full Name:</span>
                          <span className="font-bold text-slate-800">{activeOrder.customer.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Phone:</span>
                          <a href={`tel:${activeOrder.customer.phone}`} className="font-bold text-blue-600 hover:underline">
                            {activeOrder.customer.phone}
                          </a>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Email:</span>
                          <span className="text-slate-700">{activeOrder.customer.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Device Specs Card */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-blue-600" /> Device Specifications
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Category:</span>
                          <span className="font-bold text-slate-800">{activeOrder.device.category.replace("_", " ")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Brand & Model:</span>
                          <span className="font-bold text-slate-800">{activeOrder.device.brand} {activeOrder.device.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Serial Number:</span>
                          <span className="font-mono text-slate-700">{activeOrder.device.serialNumber || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Issue Description */}
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-blue-600" /> Customer Reported Issue
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {activeOrder.issueDescription}
                    </p>
                  </div>

                  {/* Device Photos Preview (NFR-06) */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-blue-600" /> Intake Device Photos ({activeOrder.device.photos.length})
                    </h4>
                    {activeOrder.device.photos.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No intake photos uploaded for this device.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {activeOrder.device.photos.map((photo, i) => (
                          <div
                            key={i}
                            onClick={() => setPreviewPhoto(`/api/uploads/device-photo/${photo}`)}
                            className="group relative aspect-video bg-slate-200 rounded-xl overflow-hidden border border-slate-300 cursor-pointer hover:border-blue-500 transition-all"
                          >
                            <img
                              src={`/api/uploads/device-photo/${photo}`}
                              alt={`Intake Photo ${i + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://placehold.co/400x300/e2e8f0/475569?text=Photo+Unavailable";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: DIAGNOSIS RECORDING FORM (FR-26, UC-06) */}
              {activeDrawerTab === "diagnosis" && (
                <div className="space-y-6">
                  {/* Historical Diagnosis Notes */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Recorded Diagnosis History
                    </h4>
                    {activeOrder.diagnosisNotes ? (
                      <pre className="text-xs font-sans text-slate-800 bg-white p-4 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed">
                        {activeOrder.diagnosisNotes}
                      </pre>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No diagnosis notes have been recorded yet.</p>
                    )}
                  </div>

                  {/* Add New Diagnosis Form */}
                  <form onSubmit={handleRecordDiagnosis} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" /> Append New Diagnostic Findings
                    </h4>

                    {diagMessage && (
                      <div
                        className={`p-3 rounded-xl text-xs font-medium ${
                          diagMessage.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {diagMessage.text}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Diagnostic Findings & Hardware Fault Assessment <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Detail physical inspection findings, fault symptoms, failed voltage rails, damaged components, or recommended repairs..."
                        value={diagNotesInput}
                        onChange={(e) => setDiagNotesInput(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-slate-600">Status transition:</label>
                        <select
                          value={diagStatusInput}
                          onChange={(e) => setDiagStatusInput(e.target.value as any)}
                          className="text-xs p-2 rounded-lg border border-slate-200 bg-white font-medium"
                        >
                          <option value="DIAGNOSING">DIAGNOSING (In active lab check)</option>
                          <option value="RECEIVED">RECEIVED (Keep current received state)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingDiag}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                      >
                        {isSubmittingDiag ? "Saving Diagnosis..." : "Save Diagnosis"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: QUOTATION BUILDER (FR-27, FR-28, BR-07) */}
              {activeDrawerTab === "quotation" && (
                <div className="space-y-6">
                  {/* Historical Quotations */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Existing Quotations ({activeOrder.quotations.length})
                    </h4>

                    {activeOrder.quotations.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No quotations issued yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {activeOrder.quotations.map((q) => (
                          <div
                            key={q.id}
                            className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">Version {q.version}</span>
                                {q.isAdditionalWork && (
                                  <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    Additional Work
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                                    q.status === "APPROVED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : q.status === "PENDING"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {q.status}
                                </span>
                              </div>
                              <span className="font-extrabold text-sm text-slate-900">
                                {q.totalAmount} {q.currency}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400">
                              Valid until: {new Date(q.validUntil).toLocaleDateString()}
                              {q.decisionAt && ` • Decision date: ${new Date(q.decisionAt).toLocaleDateString()}`}
                            </div>

                            <div className="divide-y divide-slate-100 pt-1">
                              {q.items.map((it) => (
                                <div key={it.id} className="py-1 flex justify-between text-slate-600">
                                  <span>
                                    {it.description} <span className="text-slate-400">×{it.quantity}</span>
                                  </span>
                                  <span className="font-mono font-medium">{it.lineTotal} ETB</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quotation Generator Form */}
                  <form onSubmit={handleSubmitQuotation} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Prepare Itemized Quotation</h4>
                        <p className="text-xs text-slate-500">
                          Create itemized quotation with parts and repair labor for customer approval.
                        </p>
                      </div>
                      <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-lg border border-blue-100">
                        Next: Version {(activeOrder.quotations[0]?.version || 0) + 1}
                      </span>
                    </div>

                    {quoteMessage && (
                      <div
                        className={`p-3 rounded-xl text-xs font-medium ${
                          quoteMessage.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {quoteMessage.text}
                      </div>
                    )}

                    {/* Dynamic Line Items */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 uppercase px-2">
                        <span className="col-span-6 sm:col-span-6">Description / Item</span>
                        <span className="col-span-2 sm:col-span-2 text-center">Qty</span>
                        <span className="col-span-3 sm:col-span-3 text-right">Unit Price (ETB)</span>
                        <span className="col-span-1 text-center"></span>
                      </div>

                      {quoteItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <div className="col-span-6 sm:col-span-6 space-y-1">
                            <input
                              type="text"
                              required
                              placeholder="e.g. OEM Battery Replacement, LCD Screen, Labor"
                              value={item.description}
                              onChange={(e) => handleQuoteItemChange(index, "description", e.target.value)}
                              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                            />
                            {/* Inventory quick-picker */}
                            <select
                              onChange={(e) => handleSelectInventoryForQuote(index, e.target.value)}
                              className="text-[11px] text-slate-500 bg-transparent hover:text-blue-600 focus:outline-hidden"
                            >
                              <option value="">+ Pre-fill from Inventory...</option>
                              {inventory.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.name} ({inv.unitCost} ETB)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-2 sm:col-span-2">
                            <input
                              type="number"
                              min={1}
                              required
                              value={item.quantity}
                              onChange={(e) => handleQuoteItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-center font-mono"
                            />
                          </div>

                          <div className="col-span-3 sm:col-span-3">
                            <input
                              type="number"
                              step="0.01"
                              min={1}
                              required
                              value={item.unitPrice}
                              onChange={(e) => handleQuoteItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-right font-mono font-bold"
                            />
                          </div>

                          <div className="col-span-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveQuoteItem(index)}
                              disabled={quoteItems.length === 1}
                              className="text-slate-400 hover:text-rose-500 disabled:opacity-30 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleAddQuoteItem}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 py-1 px-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Another Item
                      </button>
                    </div>

                    {/* Quotation Settings: Expiration & Additional Work */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Quotation Validity Period
                        </label>
                        <select
                          value={quoteValidDays}
                          onChange={(e) => setQuoteValidDays(Number(e.target.value))}
                          className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-medium"
                        >
                          <option value={7}>7 Days</option>
                          <option value={14}>14 Days (Standard)</option>
                          <option value={30}>30 Days</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="isAdditionalWork"
                          checked={quoteIsAdditional}
                          onChange={(e) => setQuoteIsAdditional(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <label htmlFor="isAdditionalWork" className="text-xs font-bold text-slate-700 cursor-pointer">
                          Additional Work Revision (FR-31)
                        </label>
                      </div>
                    </div>

                    {/* Summary & Submit */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-slate-500">Calculated Grand Total:</span>
                        <div className="text-xl font-extrabold text-[#0F294A]">
                          {quoteTotalETB.toFixed(2)} ETB
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingQuote || quoteTotalETB <= 0}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                      >
                        {isSubmittingQuote ? "Generating..." : "Submit Quotation to Customer"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 4: PARTS CONSUMPTION TOOL (FR-44, FR-45, BR-10) */}
              {activeDrawerTab === "parts" && (
                <div className="space-y-6">
                  {/* Currently Consumed Parts Table */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <PackageCheck className="w-3.5 h-3.5 text-blue-600" /> Parts Consumed on this Repair ({activeOrder.repairParts.length})
                    </h4>

                    {activeOrder.repairParts.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No inventory parts have been consumed on this order yet.</p>
                    ) : (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                            <tr>
                              <th className="p-3">Part Name & SKU</th>
                              <th className="p-3 text-center">Qty Used</th>
                              <th className="p-3 text-right">Recorded Unit Cost</th>
                              <th className="p-3 text-right">Total Cost</th>
                              <th className="p-3 text-right">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeOrder.repairParts.map((rp) => (
                              <tr key={rp.id}>
                                <td className="p-3">
                                  <div className="font-bold text-slate-800">{rp.part.name}</div>
                                  <div className="text-[11px] font-mono text-slate-400">SKU: {rp.part.sku}</div>
                                </td>
                                <td className="p-3 text-center font-bold text-slate-800">{rp.quantityUsed}</td>
                                <td className="p-3 text-right font-mono">{rp.recordedUnitCost} ETB</td>
                                <td className="p-3 text-right font-mono font-bold text-slate-900">
                                  {(Number(rp.recordedUnitCost) * rp.quantityUsed).toFixed(2)} ETB
                                </td>
                                <td className="p-3 text-right text-slate-400">
                                  {new Date(rp.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Deduct Stock / Record Usage Form */}
                  <form onSubmit={handleConsumePart} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <PackageMinus className="w-4 h-4 text-blue-600" /> Deduct & Record Spare Part Usage
                    </h4>

                    {partMessage && (
                      <div
                        className={`p-3 rounded-xl text-xs font-medium ${
                          partMessage.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {partMessage.text}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Part Selector */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Select Inventory Part <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={selectedPartId}
                          onChange={(e) => setSelectedPartId(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Choose Spare Part from Inventory --</option>
                          {inventory.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.sku}] {p.name} — {p.quantity} in stock ({p.unitCost} ETB)
                              {p.isLowStock ? " [LOW STOCK]" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Quantity Used <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={partQtyToConsume}
                          onChange={(e) => setPartQtyToConsume(parseInt(e.target.value) || 1)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-center font-bold"
                        />
                      </div>
                    </div>

                    {/* Stock Alert Warning if Low */}
                    {selectedPartId && (() => {
                      const sel = inventory.find((p) => p.id === selectedPartId);
                      if (!sel) return null;
                      return (
                        <div
                          className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                            sel.isLowStock
                              ? "bg-amber-50 text-amber-900 border border-amber-200"
                              : "bg-slate-50 text-slate-700 border border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {sel.isLowStock && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                            <span>
                              <strong>Current Available Stock:</strong> {sel.quantity} units (Reorder threshold: {sel.reorderThreshold})
                            </span>
                          </div>
                          <span className="font-mono font-bold">
                            Total Deduction: {(Number(sel.unitCost) * partQtyToConsume).toFixed(2)} ETB
                          </span>
                        </div>
                      );
                    })()}

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isSubmittingPart || !selectedPartId}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                      >
                        {isSubmittingPart ? "Deducting..." : "Deduct Stock & Record Usage"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 5: WORKFLOW STATUS PROGRESSION CONTROLLER (FR-35, FR-39, FR-41, BR-06, BR-09) */}
              {activeDrawerTab === "status" && (
                <div className="space-y-6">
                  {/* Status Progression Visual Stepper */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                      Workflow Pipeline Progression
                    </h4>
                    <div className="flex items-center justify-between overflow-x-auto pb-2 text-[11px] gap-2">
                      {[
                        "ACCEPTED",
                        "DIAGNOSING",
                        "QUOTATION_PENDING",
                        "APPROVED",
                        "IN_REPAIR",
                        "TESTING",
                        "READY_FOR_COLLECTION",
                        "COMPLETED",
                      ].map((st, idx) => {
                        const isCurrent = activeOrder.status === st;
                        return (
                          <div key={st} className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2.5 py-1 rounded-full font-bold transition-all ${
                                isCurrent
                                  ? "bg-blue-600 text-white shadow-md scale-105"
                                  : "bg-white text-slate-500 border border-slate-200"
                              }`}
                            >
                              {st.replace(/_/g, " ")}
                            </span>
                            {idx < 7 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Business Rule Checks Banner */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <h5 className="font-bold text-slate-700">Workflow Prerequisite Checks:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-2">
                        {hasApprovedQuote ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                        )}
                        <span>Quotation Approved by Customer (BR-06)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!hasPendingQuote ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        )}
                        <span>No Pending Quotations Awaiting Approval (BR-07)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeOrder.testingResults ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                        <span>Quality Testing Results Recorded (FR-39)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeOrder.handoverConfirmedAt ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                        <span>Device Physical Handover Confirmed (BR-09, FR-41)</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Transition Form */}
                  <form onSubmit={handleUpdateStatus} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Advance Order Status
                    </h4>

                    {statusMessage && (
                      <div
                        className={`p-3 rounded-xl text-xs font-medium ${
                          statusMessage.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {statusMessage.text}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Select Target Status <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={progNewStatus}
                        onChange={(e) => setProgNewStatus(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
                      >
                        <option value="">-- Choose New Status --</option>
                        <option value="DIAGNOSING">DIAGNOSING (Start / Continue Lab Diagnosis)</option>
                        <option value="IN_REPAIR">IN_REPAIR (Disassembly & Component Replacement)</option>
                        <option value="TESTING">TESTING (Benchmark & Quality Assurance)</option>
                        <option value="READY_FOR_COLLECTION">READY_FOR_COLLECTION (Notify Customer for Pickup)</option>
                        <option value="COMPLETED">COMPLETED (Device Handed Over & Closed)</option>
                        <option value="NEEDS_CLARIFICATION">NEEDS_CLARIFICATION (Customer Contact Needed)</option>
                        <option value="CANCELLED">CANCELLED (Repair Terminated)</option>
                      </select>
                    </div>

                    {/* Mandatory testing results if target is READY_FOR_COLLECTION */}
                    {progNewStatus === "READY_FOR_COLLECTION" && (
                      <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-2">
                        <label className="block text-xs font-bold text-amber-900">
                          Quality Testing Results & Verification Checklist <span className="text-rose-500">* (FR-39)</span>
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder="e.g. Display touch grid verified, thermal sensor within 38C operating threshold, battery charging at 18W fast rate, speaker and mic audio checks 100% OK..."
                          value={progTestingResults}
                          onChange={(e) => setProgTestingResults(e.target.value)}
                          className="w-full text-xs p-3 rounded-xl border border-amber-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    )}

                    {/* Mandatory handover confirmation if target is COMPLETED */}
                    {progNewStatus === "COMPLETED" && (
                      <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="handoverConfirmed"
                            required={!activeOrder.handoverConfirmedAt}
                            checked={progHandoverConfirmed}
                            onChange={(e) => setProgHandoverConfirmed(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
                          />
                          <label htmlFor="handoverConfirmed" className="text-xs font-bold text-emerald-900 cursor-pointer">
                            Confirm Physical Device Handover to Customer (BR-09, FR-41)
                          </label>
                        </div>
                        <p className="text-[11px] text-emerald-700">
                          Verify customer verified physical condition, tested functionality, and accepted receipt.
                        </p>
                      </div>
                    )}

                    {/* Notes for status change */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Status Change Notes <span className="text-rose-500">* (FR-35)</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Log reason for status update, current workbench milestone, or next actions..."
                        value={progNotes}
                        onChange={(e) => setProgNotes(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isSubmittingStatus || !progNewStatus}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                      >
                        {isSubmittingStatus ? "Updating Status..." : "Update Workflow Status"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 6: TIMELINE LOG */}
              {activeDrawerTab === "timeline" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Audit Trail & Repair Order History ({activeOrder.updates.length} events)
                  </h4>

                  {activeOrder.updates.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No timeline updates recorded.</p>
                  ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {activeOrder.updates.map((update) => (
                        <div key={update.id} className="relative group">
                          <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-blue-600 border-4 border-white shadow-xs" />
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">
                                {update.previousStatus ? `${update.previousStatus} → ` : ""}
                                <span className="text-blue-600 font-extrabold">{update.newStatus}</span>
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {new Date(update.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-slate-600 font-medium leading-relaxed">{update.notes}</p>
                            <div className="text-[10px] text-slate-400">
                              By {update.actorName} ({update.actorRole})
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Enlarge Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={previewPhoto}
              alt="Enlarged intake photo"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
