"use client";

import { useSearchParams } from "next/navigation";
import { PostReportClient } from "../PostReportClient";

export function QueryPostReportPage() {
  const searchParams = useSearchParams();
  return <PostReportClient postId={searchParams.get("id")} />;
}
