"use client";

import { useSearchParams } from "next/navigation";
import { PostDetailClient } from "./PostDetailClient";

export function QueryPostPage() {
  const searchParams = useSearchParams();
  return <PostDetailClient postId={searchParams.get("id")} />;
}
