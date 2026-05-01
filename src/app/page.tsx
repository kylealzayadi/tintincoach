"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { auth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      router.replace("/login");
    } else {
      router.replace(auth.role === "coach" ? "/coach" : "/dashboard");
    }
  }, [auth, router]);

  return null;
}
