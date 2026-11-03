"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Wrench,
  Smartphone,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Calendar,
  LayoutDashboard,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const userRole = (session?.user as { role?: string })?.role;

  const getDashboardHref = () => {
    if (userRole === "ADMIN") return "/admin/dashboard";
    if (userRole === "TECHNICIAN") return "/technician/dashboard";
    return "/customer/dashboard";
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "About Us", href: "/#about" },
    { name: "Track Repair", href: "/customer/dashboard" },
    { name: "Contact", href: "/#contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <div className="relative">
                <Wrench className="w-5 h-5 text-white stroke-[2.2]" />
                <Smartphone className="w-3.5 h-3.5 text-sky-200 absolute -bottom-1 -right-1" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-[#0F294A] tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                Amanuel
              </span>
              <span className="text-xs font-medium text-slate-500 mt-1 tracking-tight">
                Mobile and Computer Maintenance
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href) && link.href !== "/#about" && link.href !== "/#contact";

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-semibold transition-colors relative py-2 ${
                    isActive
                      ? "text-blue-600 font-bold"
                      : "text-slate-600 hover:text-blue-600"
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-in fade-in" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Search Trigger */}
            <div className="relative">
              {searchOpen ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      window.location.href = `/services?q=${encodeURIComponent(searchQuery.trim())}`;
                    }
                  }}
                  className="flex items-center"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search services..."
                    autoFocus
                    className="w-48 pl-3 pr-8 py-1.5 text-xs rounded-lg border border-blue-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search services"
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Auth Buttons */}
            {session?.user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={getDashboardHref()}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-colors"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50/60 border border-blue-600 rounded-lg transition-colors"
              >
                Log In
              </Link>
            )}

            {/* Solid Royal-Blue CTA */}
            <Link
              href="/book-repair"
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/30 transition-all hover:shadow-md hover:shadow-blue-600/40"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book a Repair</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {session?.user ? (
              <>
                <Link
                  href={getDashboardHref()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out ({session.user.name || session.user.email})</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 text-xs font-semibold text-blue-700 border border-blue-600 rounded-lg"
              >
                Log In
              </Link>
            )}
            <Link
              href="/book-repair"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-white bg-blue-600 rounded-lg shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>Book a Repair</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
