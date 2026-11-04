"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Wrench,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";

/**
 * Resolves an authorized, safe destination preventing open redirects, redirect loops,
 * and privilege escalations (e.g. non-admins redirected to /admin).
 */
export function getSafeRedirectUrl(role: string, callbackUrl?: string | null): string {
  if (callbackUrl) {
    try {
      const currentOrigin =
        typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

      // Protocol-relative URLs like "//attacker.com" must be rejected
      if (callbackUrl.startsWith("//")) {
        throw new Error("Protocol-relative URL forbidden");
      }

      const parsed = new URL(callbackUrl, currentOrigin);

      // Strictly verify same-origin to prevent open redirects
      if (parsed.origin === currentOrigin) {
        const path = parsed.pathname;

        // Disallow redirecting back to login, register, or API routes to prevent loops
        if (
          path !== "/login" &&
          path !== "/register" &&
          !path.startsWith("/api/") &&
          !path.includes("/auth/")
        ) {
          // Enforce role authorization on destination path
          if (path.startsWith("/admin")) {
            if (role === "ADMIN") return path + parsed.search;
          } else if (path.startsWith("/technician")) {
            if (role === "ADMIN" || role === "TECHNICIAN") return path + parsed.search;
          } else {
            return path + parsed.search;
          }
        }
      }
    } catch {
      // Invalid URL or disallowed origin, fallback to safe role defaults
    }
  }

  // Authoritative default dashboards per role
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "TECHNICIAN":
      return "/technician/dashboard";
    case "CUSTOMER":
    default:
      return "/customer/dashboard";
  }
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Client-side guard: If already authenticated on client mount, redirect to appropriate dashboard immediately
  useEffect(() => {
    let isMounted = true;
    async function checkExistingSession() {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok && isMounted) {
          const { user } = await res.json();
          if (user?.role) {
            const dest = getSafeRedirectUrl(user.role, callbackUrl);
            window.location.replace(dest);
          }
        }
      } catch {
        // Not authenticated, stay on login form
      }
    }
    checkExistingSession();
    return () => {
      isMounted = false;
    };
  }, [callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setError("Invalid email or password. Please verify your credentials.");
        setLoading(false);
        return;
      }

      // Query current user role to determine safe role-based destination
      let userRole = "CUSTOMER";
      try {
        const userRes = await fetch("/api/users/me");
        if (userRes.ok) {
          const { user } = await userRes.json();
          if (user?.role) {
            userRole = user.role;
          }
        }
      } catch (err) {
        console.warn("Could not determine user role, defaulting to customer dashboard", err);
      }

      const destination = getSafeRedirectUrl(userRole, callbackUrl);

      // Perform a full browser navigation so server components receive fresh session cookies
      // and client-side router caches are cleanly bypassed.
      window.location.replace(destination);
    } catch (err) {
      console.error("Login submission error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl shadow-slate-900/5">
      {/* Brand header */}
      <div className="text-center mb-8 space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Wrench className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <span className="text-xl font-extrabold text-[#0F294A] tracking-tight">
            Amanuel Maintenance
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-[#0F294A] pt-2">Welcome Back</h1>
        <p className="text-xs text-slate-500">
          Sign in to access your repair tracking portal or staff dashboard
        </p>
      </div>

      {/* Success banner after registration */}
      {registered && (
        <div
          role="status"
          className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Account created successfully! Please sign in with your password.</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form with accessible labels (NFR-14) */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-900 disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
            >
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-900 disabled:opacity-60"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer link to register */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/register"
            className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}
