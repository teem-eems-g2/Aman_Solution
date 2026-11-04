/**
 * Pure TypeScript utility for resolving safe post-authentication redirects.
 * Contains NO "use client", NO React hooks, and NO server-only imports,
 * allowing safe execution across both Server Components and Client Components.
 */

export function getSafeRedirectUrl(
  role: string,
  callbackUrl?: string | null
): string {
  if (callbackUrl) {
    try {
      // 1. Reject protocol-relative URLs (e.g. "//attacker.com")
      if (callbackUrl.startsWith("//")) {
        throw new Error("Protocol-relative URL forbidden");
      }

      // 2. Relative URLs starting with a single '/' are guaranteed same-origin
      if (callbackUrl.startsWith("/")) {
        const dummyBase = "http://localhost";
        const parsed = new URL(callbackUrl, dummyBase);
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
      } else if (typeof window !== "undefined") {
        // 3. Absolute URLs on client: Only allow if origin strictly matches current window origin
        const parsed = new URL(callbackUrl);
        if (parsed.origin === window.location.origin) {
          const path = parsed.pathname;

          if (
            path !== "/login" &&
            path !== "/register" &&
            !path.startsWith("/api/") &&
            !path.includes("/auth/")
          ) {
            if (path.startsWith("/admin")) {
              if (role === "ADMIN") return path + parsed.search;
            } else if (path.startsWith("/technician")) {
              if (role === "ADMIN" || role === "TECHNICIAN") return path + parsed.search;
            } else {
              return path + parsed.search;
            }
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
