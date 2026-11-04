import React, { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { getSafeRedirectUrl } from "@/lib/auth-redirect";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In | Amanuel Mobile and Computer Maintenance",
  description:
    "Sign in to access your repair tracking portal or staff dashboard.",
};

async function LoginAuthGuard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const session = await auth();

  // If already authenticated, redirect immediately on the server
  if (session?.user?.id) {
    const role = ((session.user as any).role as Role) || Role.CUSTOMER;
    const params = await searchParams;
    const rawCallback = typeof params.callbackUrl === "string" ? params.callbackUrl : undefined;
    const destination = getSafeRedirectUrl(role, rawCallback);
    redirect(destination);
  }

  return <LoginForm />;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-12 text-center text-sm font-semibold text-slate-400">
            Loading login form...
          </div>
        }
      >
        <LoginAuthGuard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
