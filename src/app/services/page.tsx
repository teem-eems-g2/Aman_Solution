import React, { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ServiceCatalogClient, SerializedService } from "./service-catalog-client";
import { Sparkles, ShieldCheck, Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Service Catalog | Amanuel Mobile and Computer Maintenance",
  description:
    "Explore our complete service menu with indicative pricing in ETB for smartphones, tablets, laptops, and desktop computers in Alamata, Tigray.",
};

async function ServicesContent() {
  const rawServices = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const serializedServices: SerializedService[] = rawServices.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    category: service.category as SerializedService["category"],
    indicativePrice: service.indicativePrice.toString(),
    isActive: service.isActive,
  }));

  return <ServiceCatalogClient initialServices={serializedServices} />;
}

export default function ServicesPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Page Banner Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TRANSPARENT REPAIR CATALOG</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F294A] tracking-tight">
            Professional Repair Services &amp; Pricing
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            All services are performed by certified hardware technicians using genuine or high-grade OEM parts. Diagnostic consultations include written itemized quotations before work starts.
          </p>
          <div className="flex items-center justify-center gap-6 pt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Transparent ETB Indicative Pricing
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Warranty on Replaced Parts
            </span>
          </div>
        </div>

        {/* Streamed dynamic content wrapped in Suspense */}
        <Suspense
          fallback={
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-sm font-semibold">Loading live service catalog...</p>
            </div>
          }
        >
          <ServicesContent />
        </Suspense>
      </div>
    </div>
  );
}
