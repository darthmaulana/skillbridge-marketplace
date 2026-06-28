"use client";

import { useRouter } from "next/navigation";
import { AboutScreen } from "@/app/components/AboutScreen";

export default function AboutPage() {
  const router = useRouter();
  return <AboutScreen onBack={() => router.back()} />;
}
