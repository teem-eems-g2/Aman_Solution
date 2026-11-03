"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wrench,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ChevronRight,
  Bell,
  Check,
  X,
  FileText,
  DollarSign,
  User,
  Shield,
  Loader2,
  ExternalLink,
  History,
  Tag,
  AlertTriangle,
} from "lucide-react";

export interface SerializedDevice {
  id: string;
  category: "MOBILE_PHONE" | "TABLET" | "LAPTOP" | "DESKTOP_COMPUTER";
  brand: string;
  model: string;
  serialNumber: string | null;
  photos: string[];
  createdAt: string;
  repairOrdersCount: number;
}

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
  items: SerializedQuotationItem[];
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

export interface SerializedAppointment {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  notes: string | null;
}

export interface SerializedPayment {
  id: string;
  amount: string;
  method: string;
  type: string;
  receiptNumber: string;
  createdAt: string;
}

export interface SerializedRepairOrder {
  id: string;
  referenceNumber: string;
  status: string;
  issueDescription: string;
  diagnosisNotes: string | null;
  testingResults: string | null;
  createdAt: string;
  device: {
    id: string;
    category: "MOBILE_PHONE" | "TABLET" | "LAPTOP" | "DESKTOP_COMPUTER";
    brand: string;
    model: string;
    serialNumber: string | null;
  };
  service: {
    id: string;
    name: string;
    indicativePrice: string;
  } | null;
  assignedTech: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  quotations: SerializedQuotation[];
  updates: SerializedRepairUpdate[];
  appointments: SerializedAppointment[];
  payments: SerializedPayment[];
}

export interface SerializedNotification {
  id: string;
  eventType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface SerializedServiceOption {
  id: string;
  name: string;
  category: "MOBILE_PHONE" | "TABLET" | "LAPTOP" | "DESKTOP_COMPUTER";
  indicativePrice: string;
}

interface CustomerDashboardClientProps {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  initialDevices: SerializedDevice[];
  initialOrders: SerializedRepairOrder[];
  services: SerializedServiceOption[];
  initialNotifications: SerializedNotification[];
}

export function CustomerDashboardClient({
  customer,
  initialDevices,
  initialOrders,
  services,
  initialNotifications,
}: CustomerDashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "orders" | "devices" | "book") || "orders";

  const [activeTab, setActiveTab] = useState<"orders" | "devices" | "book">(initialTab);
  const [devices, setDevices] = useState<SerializedDevice[]>(initialDevices);
  const [orders, setOrders] = useState<SerializedRepairOrder[]>(initialOrders);
  const [notifications, setNotifications] = useState<SerializedNotification[]>(initialNotifications);

  // Selected Order for Modal / Drawer Details
  const [selectedOrder, setSelectedOrder] = useState<SerializedRepairOrder | null>(null);

  // Modals & Forms State
  const [showNewDeviceModal, setShowNewDeviceModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Booking Form State
  const [bookingDeviceId, setBookingDeviceId] = useState<string>(devices[0]?.id || "new");
  const [isInlineDevice, setIsInlineDevice] = useState(devices.length === 0);
  const [newDeviceCategory, setNewDeviceCategory] = useState<"MOBILE_PHONE" | "TABLET" | "LAPTOP" | "DESKTOP_COMPUTER">("MOBILE_PHONE");
  const [newDeviceBrand, setNewDeviceBrand] = useState("");
  const [newDeviceModel, setNewDeviceModel] = useState("");
  const [newDeviceSerial, setNewDeviceSerial] = useState("");
  const [bookingServiceId, setBookingServiceId] = useState("");
  const [bookingIssue, setBookingIssue] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingStartTime, setBookingStartTime] = useState("10:00");
  const [bookingEndTime, setBookingEndTime] = useState("11:00");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Device Registration Modal State
  const [regCategory, setRegCategory] = useState<"MOBILE_PHONE" | "TABLET" | "LAPTOP" | "DESKTOP_COMPUTER">("MOBILE_PHONE");
  const [regBrand, setRegBrand] = useState("");
  const [regModel, setRegModel] = useState("");
  const [regSerial, setRegSerial] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Decision Loading State
  const [decisionLoading, setDecisionLoading] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const totalDevices = devices.length;
    const activeOrders = orders.filter(
      (o) => !["COMPLETED", "CANCELLED", "REJECTED"].includes(o.status)
    ).length;
    const completedOrders = orders.filter((o) => o.status === "COMPLETED").length;
    const pendingQuotations = orders.filter((o) =>
      o.quotations.some((q) => q.status === "PENDING")
    ).length;
    return { totalDevices, activeOrders, completedOrders, pendingQuotations };
  }, [devices, orders]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return { label: "Submitted", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "ACCEPTED":
        return { label: "Accepted", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "RECEIVED":
        return { label: "Device Received", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "DIAGNOSING":
        return { label: "Diagnosing", bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "QUOTATION_PENDING":
        return { label: "Quotation Pending", bg: "bg-orange-50 text-orange-700 border-orange-200 animate-pulse" };
      case "APPROVED":
        return { label: "Quotation Approved", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "IN_REPAIR":
        return { label: "In Repair", bg: "bg-cyan-50 text-cyan-700 border-cyan-200" };
      case "TESTING":
        return { label: "Quality Testing", bg: "bg-sky-50 text-sky-700 border-sky-200" };
      case "READY_FOR_COLLECTION":
        return { label: "Ready for Pick Up", bg: "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold" };
      case "COMPLETED":
        return { label: "Completed", bg: "bg-slate-100 text-slate-800 border-slate-300" };
      case "CANCELLED":
      case "REJECTED":
        return { label: status, bg: "bg-rose-50 text-rose-700 border-rose-200" };
      default:
        return { label: status, bg: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  const getDeviceIcon = (category: string) => {
    switch (category) {
      case "MOBILE_PHONE":
        return Smartphone;
      case "TABLET":
        return Tablet;
      case "LAPTOP":
        return Laptop;
      case "DESKTOP_COMPUTER":
        return Monitor;
      default:
        return Wrench;
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (e) {
      console.error("Mark read error:", e);
    }
  };

  // Register New Device Form Submission
  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegSubmitting(true);

    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: regCategory,
          brand: regBrand.trim(),
          model: regModel.trim(),
          serialNumber: regSerial.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to register device", "error");
        setRegSubmitting(false);
        return;
      }

      const created: SerializedDevice = {
        id: data.device.id,
        category: data.device.category,
        brand: data.device.brand,
        model: data.device.model,
        serialNumber: data.device.serialNumber,
        photos: data.device.photos || [],
        createdAt: data.device.createdAt,
        repairOrdersCount: 0,
      };

      setDevices([created, ...devices]);
      setShowNewDeviceModal(false);
      setRegBrand("");
      setRegModel("");
      setRegSerial("");
      showToast(`Device ${created.brand} ${created.model} registered successfully!`);
    } catch (e) {
      console.error("Register device error:", e);
      showToast("An unexpected error occurred registering device", "error");
    } finally {
      setRegSubmitting(false);
    }
  };

  // Book a Repair Submission
  const handleBookRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSubmitting(true);

    try {
      const payload: Record<string, any> = {
        issueDescription: bookingIssue.trim(),
        serviceId: bookingServiceId || undefined,
      };

      if (isInlineDevice) {
        payload.device = {
          category: newDeviceCategory,
          brand: newDeviceBrand.trim(),
          model: newDeviceModel.trim(),
          serialNumber: newDeviceSerial.trim() || undefined,
          photos: [],
        };
      } else {
        payload.deviceId = bookingDeviceId;
      }

      if (bookingDate && bookingStartTime && bookingEndTime) {
        const startISO = new Date(`${bookingDate}T${bookingStartTime}:00Z`).toISOString();
        const endISO = new Date(`${bookingDate}T${bookingEndTime}:00Z`).toISOString();
        payload.preferredAppointmentStart = startISO;
        payload.preferredAppointmentEnd = endISO;
      }

      const res = await fetch("/api/repair-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to submit repair request", "error");
        setBookingSubmitting(false);
        return;
      }

      // Add to orders list
      const createdOrder: SerializedRepairOrder = {
        id: data.repairOrder.id,
        referenceNumber: data.repairOrder.referenceNumber,
        status: data.repairOrder.status,
        issueDescription: data.repairOrder.issueDescription,
        diagnosisNotes: null,
        testingResults: null,
        createdAt: data.repairOrder.createdAt,
        device: {
          id: data.repairOrder.device.id,
          category: data.repairOrder.device.category,
          brand: data.repairOrder.device.brand,
          model: data.repairOrder.device.model,
          serialNumber: data.repairOrder.device.serialNumber,
        },
        service: data.repairOrder.service
          ? {
              id: data.repairOrder.service.id,
              name: data.repairOrder.service.name,
              indicativePrice: data.repairOrder.service.indicativePrice.toString(),
            }
          : null,
        assignedTech: null,
        quotations: [],
        updates: [
          {
            id: "init",
            previousStatus: null,
            newStatus: "SUBMITTED",
            notes: "Repair request submitted by customer.",
            createdAt: new Date().toISOString(),
            actorName: customer.name,
            actorRole: "CUSTOMER",
          },
        ],
        appointments: data.repairOrder.appointments
          ? data.repairOrder.appointments.map((a: any) => ({
              id: a.id,
              scheduledStart: a.scheduledStart,
              scheduledEnd: a.scheduledEnd,
              status: a.status,
              notes: a.notes,
            }))
          : [],
        payments: [],
      };

      setOrders([createdOrder, ...orders]);
      // If inline device created, add to devices
      if (isInlineDevice && data.repairOrder.device) {
        setDevices([
          {
            id: data.repairOrder.device.id,
            category: data.repairOrder.device.category,
            brand: data.repairOrder.device.brand,
            model: data.repairOrder.device.model,
            serialNumber: data.repairOrder.device.serialNumber,
            photos: data.repairOrder.device.photos || [],
            createdAt: data.repairOrder.device.createdAt,
            repairOrdersCount: 1,
          },
          ...devices,
        ]);
      }

      // Reset form & switch to orders tab
      setBookingIssue("");
      setBookingServiceId("");
      setBookingDate("");
      setActiveTab("orders");
      setSelectedOrder(createdOrder);
      showToast(`Repair request submitted successfully! Ref: ${createdOrder.referenceNumber}`);
    } catch (e) {
      console.error("Booking error:", e);
      showToast("An unexpected error occurred submitting repair request", "error");
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Quotation Decision (Approve / Reject) (FR-30, FR-31, UC-08)
  const handleQuotationDecision = async (
    quotationId: string,
    decision: "APPROVED" | "REJECTED"
  ) => {
    setDecisionLoading(true);

    try {
      const res = await fetch(`/api/quotations/${quotationId}/decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || `Failed to ${decision.toLowerCase()} quotation`, "error");
        setDecisionLoading(false);
        return;
      }

      // Update state in local orders list and selectedOrder
      const newOrderStatus = decision === "APPROVED" ? "APPROVED" : "QUOTATION_PENDING";
      const updatedOrders = orders.map((o) => {
        const hasQuote = o.quotations.some((q) => q.id === quotationId);
        if (!hasQuote) return o;

        const updatedQuotes = o.quotations.map((q) =>
          q.id === quotationId
            ? { ...q, status: decision as SerializedQuotation["status"], decisionAt: new Date().toISOString() }
            : q
        );

        const newUpdate: SerializedRepairUpdate = {
          id: `update-${Date.now()}`,
          previousStatus: o.status,
          newStatus: newOrderStatus,
          notes: `Quotation v${data.quotation.version} ${decision.toLowerCase()} by customer.`,
          createdAt: new Date().toISOString(),
          actorName: customer.name,
          actorRole: "CUSTOMER",
        };

        return {
          ...o,
          status: newOrderStatus,
          quotations: updatedQuotes,
          updates: [newUpdate, ...o.updates],
        };
      });

      setOrders(updatedOrders);
      if (selectedOrder) {
        const updatedSelected = updatedOrders.find((o) => o.id === selectedOrder.id) || null;
        setSelectedOrder(updatedSelected);
      }

      showToast(`Quotation v${data.quotation.version} has been ${decision.toLowerCase()}!`);
    } catch (e) {
      console.error("Quotation decision error:", e);
      showToast("An error occurred recording quotation decision", "error");
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-bold text-white ${
              toastMessage.type === "success" ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header & Greeting Bar */}
      <div className="bg-[#0A1D3B] text-white pt-10 pb-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-sky-300 text-xs font-bold uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5" />
                <span>CUSTOMER REPAIR PORTAL</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {customer.name}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {customer.email} • {customer.phone}
              </p>
            </div>

            {/* Notification & Quick Actions */}
            <div className="flex items-center gap-3">
              {/* Notification Bell Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-extrabold flex items-center justify-center animate-pulse">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 text-slate-900 z-50 animate-in fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Notifications ({notifications.length})
                      </h4>
                      <button
                        onClick={() => setShowNotificationsDropdown(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 pt-2">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs space-y-1 rounded-xl transition-colors ${
                              n.isRead ? "bg-transparent text-slate-600" : "bg-blue-50/70 text-slate-900 font-medium"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-blue-600 uppercase">
                                {n.eventType.replace(/_/g, " ")}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="leading-relaxed">{n.message}</p>
                            {!n.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(n.id)}
                                className="text-[11px] text-blue-600 font-bold hover:underline pt-1 block"
                              >
                                Mark as Read
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-6 text-xs text-slate-400">
                          No notifications yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Book Repair Quick Button */}
              <button
                type="button"
                onClick={() => setActiveTab("book")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>Book a Repair</span>
              </button>
            </div>
          </div>

          {/* 3 Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="p-5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-sky-300 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-300 block font-medium">Registered Devices</span>
                <span className="text-2xl font-black text-white">{stats.totalDevices}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-300 block font-medium">Active Repair Orders</span>
                <span className="text-2xl font-black text-white">{stats.activeOrders}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-300 block font-medium">Completed Repairs</span>
                <span className="text-2xl font-black text-white">{stats.completedOrders}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabbed Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Navigation Tabs Bar */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 mb-8 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "orders"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Repair Orders &amp; Live Tracking</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === "orders" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("devices")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "devices"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>My Registered Devices</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === "devices" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {devices.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("book")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "book"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-blue-600 hover:bg-blue-50"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Book a Repair</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: REPAIR ORDERS & LIVE TRACKING                         */}
        {/* ============================================================ */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Active Action Banner for Pending Quotations */}
            {stats.pendingQuotations > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      Action Required: Quotation Awaiting Your Approval
                    </h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      You have {stats.pendingQuotations} repair order(s) with transparent quotations prepared. Review and approve to proceed with repair.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {orders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  const DeviceIcon = getDeviceIcon(order.device.category);
                  const pendingQuote = order.quotations.find((q) => q.status === "PENDING");

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg hover:border-blue-200 transition-all group"
                    >
                      <div>
                        {/* Reference & Status Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                            {order.referenceNumber}
                          </span>
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>

                        {/* Device Info */}
                        <div className="flex items-center gap-3 my-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                            <DeviceIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[#0F294A]">
                              {order.device.brand} {order.device.model}
                            </h3>
                            <span className="text-[11px] text-slate-400">
                              SN: {order.device.serialNumber || "N/A"}
                            </span>
                          </div>
                        </div>

                        {/* Issue description preview */}
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          &ldquo;{order.issueDescription}&rdquo;
                        </p>

                        {/* Pending Quotation Callout */}
                        {pendingQuote && (
                          <div className="mt-4 p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 text-xs flex items-center justify-between">
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-orange-700">
                                Quotation v{pendingQuote.version} Pending
                              </span>
                              <span className="text-sm font-black text-orange-900">
                                {pendingQuote.totalAmount} {pendingQuote.currency}
                              </span>
                            </div>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] shadow-xs"
                            >
                              Review &amp; Decide
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Timestamp & Action button */}
                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
                        >
                          <span>View Details &amp; Timeline</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Wrench className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#0F294A]">No Repair Orders Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You haven&apos;t booked any device repairs yet. Get started by submitting a request for your phone, tablet, laptop, or desktop computer.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("book")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Book Your First Repair</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: MY REGISTERED DEVICES                                 */}
        {/* ============================================================ */}
        {activeTab === "devices" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0F294A]">Your Registered Devices</h3>
                <p className="text-xs text-slate-500">
                  Manage your hardware profile to quickly book repairs and track service histories.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewDeviceModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Device</span>
              </button>
            </div>

            {devices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((device) => {
                  const DeviceIcon = getDeviceIcon(device.category);
                  return (
                    <div
                      key={device.id}
                      className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            {device.category.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-slate-400">
                            {device.repairOrdersCount} repair(s)
                          </span>
                        </div>

                        <div className="flex items-center gap-3.5 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <DeviceIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-[#0F294A]">
                              {device.brand} {device.model}
                            </h4>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                              SN: {device.serialNumber || "None registered"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Added {new Date(device.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setBookingDeviceId(device.id);
                            setIsInlineDevice(false);
                            setActiveTab("book");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Book Repair</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Smartphone className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#0F294A]">No Devices Registered</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Register your smartphone, tablet, laptop, or desktop computer to easily submit maintenance requests.
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewDeviceModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register a Device Now</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: BOOK A REPAIR WIZARD                                  */}
        {/* ============================================================ */}
        {activeTab === "book" && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
            <div className="mb-8">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                STEP-BY-STEP REPAIR BOOKING
              </span>
              <h2 className="text-2xl font-extrabold text-[#0F294A] tracking-tight mt-1">
                Book a Device Repair Appointment
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tell us about your hardware and preferred time slot. Our technicians will inspect your device and prepare a transparent itemized quotation.
              </p>
            </div>

            <form onSubmit={handleBookRepair} className="space-y-8">
              {/* Step 1: Select Device */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">1</span>
                  <span>Select or Register Device</span>
                </h3>

                {devices.length > 0 && (
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deviceOption"
                        checked={!isInlineDevice}
                        onChange={() => setIsInlineDevice(false)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Choose from Registered Devices</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deviceOption"
                        checked={isInlineDevice}
                        onChange={() => setIsInlineDevice(true)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Add a New Device</span>
                    </label>
                  </div>
                )}

                {!isInlineDevice && devices.length > 0 ? (
                  <div>
                    <label htmlFor="bookingDeviceId" className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Device
                    </label>
                    <select
                      id="bookingDeviceId"
                      value={bookingDeviceId}
                      onChange={(e) => setBookingDeviceId(e.target.value)}
                      className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    >
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.brand} {d.model} ({d.category.replace(/_/g, " ")}) {d.serialNumber ? `— SN: ${d.serialNumber}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="newDeviceCategory" className="block text-xs font-bold text-slate-700 mb-1">
                          Category
                        </label>
                        <select
                          id="newDeviceCategory"
                          value={newDeviceCategory}
                          onChange={(e) => setNewDeviceCategory(e.target.value as any)}
                          className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white"
                        >
                          <option value="MOBILE_PHONE">Mobile Phone</option>
                          <option value="TABLET">Tablet</option>
                          <option value="LAPTOP">Laptop</option>
                          <option value="DESKTOP_COMPUTER">Desktop Computer</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="newDeviceBrand" className="block text-xs font-bold text-slate-700 mb-1">
                          Brand
                        </label>
                        <input
                          id="newDeviceBrand"
                          type="text"
                          required={isInlineDevice}
                          value={newDeviceBrand}
                          onChange={(e) => setNewDeviceBrand(e.target.value)}
                          placeholder="e.g. Samsung, Apple, Dell"
                          className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="newDeviceModel" className="block text-xs font-bold text-slate-700 mb-1">
                          Model
                        </label>
                        <input
                          id="newDeviceModel"
                          type="text"
                          required={isInlineDevice}
                          value={newDeviceModel}
                          onChange={(e) => setNewDeviceModel(e.target.value)}
                          placeholder="e.g. Galaxy S23 Ultra, XPS 15"
                          className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="newDeviceSerial" className="block text-xs font-bold text-slate-700 mb-1">
                        Serial Number (Optional)
                      </label>
                      <input
                        id="newDeviceSerial"
                        type="text"
                        value={newDeviceSerial}
                        onChange={(e) => setNewDeviceSerial(e.target.value)}
                        placeholder="e.g. R58M123456X"
                        className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Choose Service Catalog Item (Optional) */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">2</span>
                  <span>Select Service (Optional)</span>
                </h3>
                <div>
                  <label htmlFor="bookingServiceId" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pre-select Diagnostic or Repair Service
                  </label>
                  <select
                    id="bookingServiceId"
                    value={bookingServiceId}
                    onChange={(e) => setBookingServiceId(e.target.value)}
                    className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="">General Diagnosis &amp; Assessment (Custom Quote)</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category.replace(/_/g, " ")}) — Indicative: {s.indicativePrice} ETB
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 3: Issue Description (Min 10 characters) */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">3</span>
                  <span>Describe the Issue</span>
                </h3>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="bookingIssue" className="block text-xs font-bold text-slate-700">
                      Issue Description <span className="text-rose-500">*</span>
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        bookingIssue.trim().length >= 10 ? "text-emerald-600 font-bold" : "text-slate-400"
                      }`}
                    >
                      {bookingIssue.trim().length}/10 chars minimum
                    </span>
                  </div>
                  <textarea
                    id="bookingIssue"
                    required
                    minLength={10}
                    rows={4}
                    value={bookingIssue}
                    onChange={(e) => setBookingIssue(e.target.value)}
                    placeholder="Describe what is wrong with the device (e.g. Screen cracked, battery draining fast, device not powering on)..."
                    className="w-full p-3 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Step 4: Preferred Appointment Slot (Optional) */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">4</span>
                  <span>Preferred In-Shop Appointment (Optional)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="bookingDate" className="block text-xs font-bold text-slate-700 mb-1">
                      Date
                    </label>
                    <input
                      id="bookingDate"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="bookingStartTime" className="block text-xs font-bold text-slate-700 mb-1">
                      Start Time
                    </label>
                    <input
                      id="bookingStartTime"
                      type="time"
                      value={bookingStartTime}
                      onChange={(e) => setBookingStartTime(e.target.value)}
                      className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="bookingEndTime" className="block text-xs font-bold text-slate-700 mb-1">
                      End Time
                    </label>
                    <input
                      id="bookingEndTime"
                      type="time"
                      value={bookingEndTime}
                      onChange={(e) => setBookingEndTime(e.target.value)}
                      className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={bookingSubmitting || bookingIssue.trim().length < 10}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {bookingSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Submit Repair Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL / DRAWER: ORDER DETAILS, TIMELINE & QUOTATION DECISION */}
      {/* ============================================================ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 bg-[#0A1D3B] text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold text-sky-300 bg-blue-500/20 px-2.5 py-1 rounded-lg border border-sky-400/30">
                    {selectedOrder.referenceNumber}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                    {selectedOrder.status.replace(/_/g, " ")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-2">
                  {selectedOrder.device.brand} {selectedOrder.device.model}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-8 max-h-[75vh] overflow-y-auto">
              {/* Order Info Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Submitted</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Category</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrder.device.category.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Assigned Tech</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrder.assignedTech?.name || "Pending Review"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Serial Number</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {selectedOrder.device.serialNumber || "N/A"}
                  </span>
                </div>
              </div>

              {/* Diagnosis & Testing Notes if available */}
              {(selectedOrder.diagnosisNotes || selectedOrder.testingResults) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Technician Diagnostic Findings &amp; Quality Inspection
                  </h4>
                  {selectedOrder.diagnosisNotes && (
                    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-800 leading-relaxed">
                      <strong className="block text-blue-900 mb-1">Diagnosis Notes:</strong>
                      {selectedOrder.diagnosisNotes}
                    </div>
                  )}
                  {selectedOrder.testingResults && (
                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-slate-800 leading-relaxed">
                      <strong className="block text-emerald-900 mb-1">Testing Results:</strong>
                      {selectedOrder.testingResults}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* INTERACTIVE QUOTATION BOX (UC-08, FR-30, FR-31)              */}
              {/* ============================================================ */}
              {selectedOrder.quotations.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Itemized Quotations ({selectedOrder.quotations.length})
                    </h4>
                  </div>

                  {selectedOrder.quotations.map((q) => {
                    const isPending = q.status === "PENDING";
                    return (
                      <div
                        key={q.id}
                        className={`p-5 rounded-2xl border ${
                          isPending
                            ? "bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20"
                            : "bg-white border-slate-200"
                        } space-y-4`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#0F294A]">
                              Quotation Version {q.version}
                            </span>
                            {q.isAdditionalWork && (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                                Additional Work
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                              q.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : q.status === "PENDING"
                                ? "bg-amber-100 text-amber-800 animate-pulse"
                                : q.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {q.status}
                          </span>
                        </div>

                        {/* Line Items Table */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[11px] font-bold uppercase">
                              <tr>
                                <th className="p-2.5">Description</th>
                                <th className="p-2.5 text-center">Qty</th>
                                <th className="p-2.5 text-right">Unit Price</th>
                                <th className="p-2.5 text-right">Line Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {q.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="p-2.5 font-medium text-slate-800">{item.description}</td>
                                  <td className="p-2.5 text-center text-slate-600">{item.quantity}</td>
                                  <td className="p-2.5 text-right text-slate-600">{item.unitPrice} {q.currency}</td>
                                  <td className="p-2.5 text-right font-bold text-slate-900">{item.lineTotal} {q.currency}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                              <tr>
                                <td colSpan={3} className="p-2.5 text-right text-slate-700">Total Quotation:</td>
                                <td className="p-2.5 text-right text-base text-blue-700">{q.totalAmount} {q.currency}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Interactive Decision Actions for PENDING Quotations */}
                        {isPending && (
                          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-100/60 p-4 rounded-xl border border-amber-200">
                            <div className="text-xs text-amber-900">
                              <span className="font-bold block">Please approve or reject this estimate:</span>
                              <span className="text-[11px] text-amber-800">
                                Valid until: {new Date(q.validUntil).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <button
                                type="button"
                                disabled={decisionLoading}
                                onClick={() => handleQuotationDecision(q.id, "REJECTED")}
                                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-rose-400 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs transition-colors disabled:opacity-60"
                              >
                                Reject Quotation
                              </button>
                              <button
                                type="button"
                                disabled={decisionLoading}
                                onClick={() => handleQuotationDecision(q.id, "APPROVED")}
                                className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                              >
                                {decisionLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                <span>Approve Quotation</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ============================================================ */}
              {/* VERTICAL LIVE STATUS TIMELINE (FR-38)                        */}
              {/* ============================================================ */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Live Repair Status History Timeline
                </h4>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {selectedOrder.updates.map((update, idx) => (
                    <div key={update.id} className="relative">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[19px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                          idx === 0 ? "bg-blue-600 ring-4 ring-blue-100" : "bg-slate-400"
                        }`}
                      />
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F294A]">
                            {update.newStatus.replace(/_/g, " ")}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(update.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{update.notes}</p>
                        <span className="text-[10px] text-slate-400 block pt-1">
                          Logged by: {update.actorName} ({update.actorRole})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: REGISTER NEW DEVICE (INDEPENDENT)                      */}
      {/* ============================================================ */}
      {showNewDeviceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0F294A]">Register Device</h3>
                <p className="text-xs text-slate-500">Add a new device to your customer profile</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewDeviceModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterDevice} className="space-y-4 text-xs">
              <div>
                <label htmlFor="regCategory" className="block font-bold text-slate-700 mb-1">
                  Device Category <span className="text-rose-500">*</span>
                </label>
                <select
                  id="regCategory"
                  value={regCategory}
                  onChange={(e) => setRegCategory(e.target.value as any)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-50"
                >
                  <option value="MOBILE_PHONE">Mobile Phone</option>
                  <option value="TABLET">Tablet</option>
                  <option value="LAPTOP">Laptop</option>
                  <option value="DESKTOP_COMPUTER">Desktop Computer</option>
                </select>
              </div>

              <div>
                <label htmlFor="regBrand" className="block font-bold text-slate-700 mb-1">
                  Brand <span className="text-rose-500">*</span>
                </label>
                <input
                  id="regBrand"
                  type="text"
                  required
                  value={regBrand}
                  onChange={(e) => setRegBrand(e.target.value)}
                  placeholder="e.g. Samsung, Apple, HP"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-slate-50"
                />
              </div>

              <div>
                <label htmlFor="regModel" className="block font-bold text-slate-700 mb-1">
                  Model <span className="text-rose-500">*</span>
                </label>
                <input
                  id="regModel"
                  type="text"
                  required
                  value={regModel}
                  onChange={(e) => setRegModel(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro, Pavilion 15"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-slate-50"
                />
              </div>

              <div>
                <label htmlFor="regSerial" className="block font-bold text-slate-700 mb-1">
                  Serial Number (Optional)
                </label>
                <input
                  id="regSerial"
                  type="text"
                  value={regSerial}
                  onChange={(e) => setRegSerial(e.target.value)}
                  placeholder="e.g. F2LXM012345"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={regSubmitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {regSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <span>Register Device</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
