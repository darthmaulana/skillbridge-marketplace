"use client";

import { useParams } from "next/navigation";
import { PostReportClient } from "../../PostReportClient";

export default function ClientPage() {
  const params = useParams<{ id: string }>();
  return <PostReportClient postId={params.id} />;
}
