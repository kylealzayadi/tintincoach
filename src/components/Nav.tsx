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
    <nav className="border-b-2 border-border bg-card sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={role === "coach" ? "/coach" : "/dashboard"} className="font-black text-base mr-3">
            <span className="text-accent">WAR</span>
          </Link>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                pathname === link.href
                  ? "bg-accent text-white shadow-[0_0_15px_var(--color-accent-glow)]"
                  : "text-muted hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">{role}</span>
          <button
            onClick={handleSignOut}
            className="text-xs font-bold text-muted hover:text-danger transition"
          >
            Out
          </button>
        </div>
      </div>
    </nav>
  );
}
