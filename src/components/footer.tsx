"use client";

import React from "react";
import Link from "next/link";
import { Phone, MapPin, Clock, Wrench, Smartphone, Laptop, Monitor } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto">
      {/* Upper Contact Bar - Dark Navy (#0F294A) */}
      <div className="bg-[#0F294A] text-white py-6 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            {/* Item 1: Phone */}
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Need Help? Call Us
                </span>
                <span className="text-base font-bold text-white tracking-wide">
                  +251 91 413 1094
                </span>
              </div>
            </div>

            {/* Item 2: Location */}
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Our Location
                </span>
                <span className="text-base font-bold text-white">
                  Alamata, Tigray, Ethiopia
                </span>
              </div>
            </div>

            {/* Item 3: Working Hours */}
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Working Hours
                </span>
                <span className="text-base font-bold text-white">
                  Mon – Sat: 8:00 AM – 6:00 PM
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Body - Deep Navy */}
      <div className="bg-[#0A1D3B] text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand column */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                  <Wrench className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-extrabold text-white">Amanuel</span>
                  <span className="text-xs text-slate-400 font-medium">Maintenance</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Professional repair center for smartphones, tablets, laptops, and desktop computers in Alamata, Tigray, Ethiopia. Genuine parts, warranty, and fast turnaround.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold text-white tracking-wider uppercase mb-3">
                Quick Links
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/" className="hover:text-blue-400 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="hover:text-blue-400 transition-colors">
                    Service Catalog
                  </Link>
                </li>
                <li>
                  <Link href="/customer/dashboard" className="hover:text-blue-400 transition-colors">
                    Track Repair Status
                  </Link>
                </li>
                <li>
                  <Link href="/book-repair" className="hover:text-blue-400 transition-colors">
                    Book an Appointment
                  </Link>
                </li>
              </ul>
            </div>

            {/* Device Categories */}
            <div>
              <h4 className="text-sm font-bold text-white tracking-wider uppercase mb-3">
                Supported Devices
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  <Link href="/services?category=MOBILE_PHONE" className="hover:text-blue-400">
                    Mobile Phones
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                  <Link href="/services?category=TABLET" className="hover:text-blue-400">
                    Tablets & iPads
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                  <Link href="/services?category=LAPTOP" className="hover:text-blue-400">
                    Laptops & MacBooks
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-amber-400" />
                  <Link href="/services?category=DESKTOP_COMPUTER" className="hover:text-blue-400">
                    Desktop Workstations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal / Account */}
            <div>
              <h4 className="text-sm font-bold text-white tracking-wider uppercase mb-3">
                Account & Portals
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/login" className="hover:text-blue-400 transition-colors">
                    Customer Login
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-blue-400 transition-colors">
                    Create Customer Account
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-blue-400 transition-colors">
                    Staff Portal (Tech / Admin)
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
            <p>© 2026 Amanuel Mobile and Computer Maintenance. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">Quality Guaranteed • Certified Technicians • Alamata, Tigray, Ethiopia</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
