"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";

interface NavProps {
  role: UserRole;
  unreadCount?: number;
}

export default function Nav({ role, unreadCount = 0 }: NavProps) {
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
      <div className="max-w-3xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href={role === "coach" ? "/coach" : "/dashboard"} className="font-black text-xs sm:text-sm mr-1 sm:mr-3 whitespace-nowrap">
            <span className="text-white">PROJECT </span><span className="text-accent">WAR</span>
            <span className="text-muted text-[9px] sm:text-[10px] ml-1">by TinTin</span>
          </Link>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                pathname === link.href
                  ? "bg-accent text-white shadow-[0_0_15px_var(--color-accent-glow)]"
                  : "text-muted hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notes icon with notification badge */}
          <Link
            href={role === "coach" ? "/coach" : "/dashboard"}
            className="relative p-1.5 text-muted hover:text-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[9px] font-black rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <button
            onClick={handleSignOut}
            className="bg-accent hover:bg-accent-hover text-white rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-black uppercase tracking-wider transition-all hover:shadow-[0_0_20px_var(--color-accent-glow)] active:scale-95"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}
