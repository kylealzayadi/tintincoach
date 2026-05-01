"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";

interface NavProps {
  role: UserRole;
}

export default function Nav({ role }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const links =
    role === "coach"
      ? [{ href: "/coach", label: "Dashboard" }]
      : [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/log", label: "Log" },
        ];

  function handleSignOut() {
    logout();
    router.push("/login");
  }

  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Link href={role === "coach" ? "/coach" : "/dashboard"} className="font-semibold mr-4">
            TinTin
          </Link>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                pathname === link.href
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted capitalize">{role}</span>
          <button
            onClick={handleSignOut}
            className="text-xs text-muted hover:text-foreground transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
