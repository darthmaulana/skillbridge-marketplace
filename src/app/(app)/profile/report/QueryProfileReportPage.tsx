"use client";

import { useSearchParams } from "next/navigation";
import { ProfileReportClient } from "../ProfileReportClient";

export function QueryProfileReportPage() {
  const searchParams = useSearchParams();
  return <ProfileReportClient profileId={searchParams.get("id")} />;
}
