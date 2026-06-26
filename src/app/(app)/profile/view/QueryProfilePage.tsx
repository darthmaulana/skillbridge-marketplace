"use client";

import { useSearchParams } from "next/navigation";
import { PublicProfileClient } from "../PublicProfileClient";

export function QueryProfilePage() {
  const searchParams = useSearchParams();
  return <PublicProfileClient profileId={searchParams.get("id")} />;
}
