"use client";

import { useRouter } from "next/navigation";
import { SearchScreen } from "@/app/components/SearchScreen";
import { useAppState } from "@/components/providers/AppStateProvider";

export default function SearchPage() {
  const router = useRouter();
  const { posts } = useAppState();
  return <SearchScreen posts={posts} onPostClick={(post) => router.push(`/posts?id=${encodeURIComponent(post.id)}`)} />;
}
