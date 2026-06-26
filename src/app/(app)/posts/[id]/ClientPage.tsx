"use client";

import { useParams } from "next/navigation";
import { PostDetailClient } from "../PostDetailClient";

export default function ClientPage() {
  const params = useParams<{ id: string }>();
  return <PostDetailClient postId={params.id} />;
}
