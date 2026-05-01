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
            <span className="text-white">PROJECT </span><span className="text-accent">WAR</span>
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
          <span
            className="text-lg font-black uppercase tracking-wider animate-rainbow"
            style={{
              backgroundImage: "linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #00aaff, #8800ff, #ff00ff, #ff0000)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {role}
          </span>
          <button
            onClick={handleSignOut}
            className="bg-accent hover:bg-accent-hover text-white rounded-xl px-4 py-2 text-sm font-black uppercase tracking-wider transition-all hover:shadow-[0_0_20px_var(--color-accent-glow)] active:scale-95"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}
