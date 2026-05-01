"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const success = login(password);
    if (!success) {
      setError("Invalid password");
      return;
    }

    const stored = localStorage.getItem("tintin_auth");
    if (stored) {
      const { role } = JSON.parse(stored);
      router.push(role === "coach" ? "/coach" : "/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-2">
            PROJECT: <span className="text-accent">WAR</span>
          </h1>
          <p className="text-muted text-sm font-bold uppercase tracking-widest">by TINTIN</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full bg-card border-2 border-border rounded-2xl px-5 py-4 text-base font-bold text-center focus:outline-none focus:border-accent focus:shadow-[0_0_20px_var(--color-accent-glow)] transition-all placeholder:text-muted placeholder:font-medium"
              placeholder="Enter access code"
            />
          </div>

          {error && <p className="text-danger text-sm font-bold">{error}</p>}

          <button
            type="submit"
            className="w-full bg-accent hover:bg-accent-hover text-white rounded-2xl px-6 py-5 text-lg font-black uppercase tracking-wider transition-all hover:shadow-[0_0_30px_var(--color-accent-glow)] active:scale-[0.98]"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
