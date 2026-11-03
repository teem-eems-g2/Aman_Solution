"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Tag,
  ArrowRight,
  Filter,
  CheckCircle,
} from "lucide-react";

export interface SerializedService {
  id: string;
  name: string;
  description: string;
  category: "MOBILE_PHONE" | "TABLET" | "LAPTOP" | "DESKTOP_COMPUTER";
  indicativePrice: string;
  isActive: boolean;
}

const CATEGORIES = [
  { id: "ALL", label: "All Services", icon: Filter },
  { id: "MOBILE_PHONE", label: "Mobile Phones", icon: Smartphone },
  { id: "TABLET", label: "Tablets", icon: Tablet },
  { id: "LAPTOP", label: "Laptops", icon: Laptop },
  { id: "DESKTOP_COMPUTER", label: "Desktop Computers", icon: Monitor },
] as const;

export function ServiceCatalogClient({
  initialServices,
}: {
  initialServices: SerializedService[];
}) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "ALL";
  const initialQuery = searchParams.get("q") || "";

  const [selectedCategory, setSelectedCategory] = useState<string>(
    CATEGORIES.some((c) => c.id === initialCategory) ? initialCategory : "ALL"
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const filteredServices = useMemo(() => {
    return initialServices.filter((service) => {
      const matchesCategory =
        selectedCategory === "ALL" || service.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        service.name.toLowerCase().includes(q) ||
        service.description.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [initialServices, selectedCategory, searchQuery]);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "MOBILE_PHONE":
        return {
          label: "Mobile Phone",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: Smartphone,
        };
      case "TABLET":
        return {
          label: "Tablet",
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          icon: Tablet,
        };
      case "LAPTOP":
        return {
          label: "Laptop",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: Laptop,
        };
      case "DESKTOP_COMPUTER":
        return {
          label: "Desktop Computer",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Monitor,
        };
      default:
        return {
          label: category,
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          icon: Tag,
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service name or keyword..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const badge = getCategoryBadge(service.category);
            const BadgeIcon = badge.icon;
            return (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg hover:border-blue-200 transition-all group"
              >
                <div>
                  {/* Category badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${badge.bg}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                      <CheckCircle className="w-3 h-3" />
                      <span>Available</span>
                    </span>
                  </div>

                  {/* Service Name */}
                  <h3 className="text-base font-bold text-[#0F294A] group-hover:text-blue-600 transition-colors">
                    {service.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Price & Booking Button */}
                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium block">
                      Indicative Price
                    </span>
                    <span className="text-lg font-black text-[#0F294A]">
                      {Number(service.indicativePrice).toLocaleString()} <span className="text-xs font-bold text-blue-600">ETB</span>
                    </span>
                  </div>

                  <Link
                    href={`/book-repair?serviceId=${encodeURIComponent(service.id)}&category=${encodeURIComponent(service.category)}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all"
                  >
                    <span>Book This Service</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Services Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No active repair services match your current search criteria. Try selecting another category or clearing your search term.
          </p>
          <button
            onClick={() => {
              setSelectedCategory("ALL");
              setSearchQuery("");
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
