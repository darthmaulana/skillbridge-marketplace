"use client";

import { useRouter } from "next/navigation";
import { HomeScreen } from "@/app/components/HomeScreen";
import { useAppState } from "@/components/providers/AppStateProvider";

export default function HomePage() {
  const router = useRouter();
  const { posts, postsError, postsLoading, reloadPosts } = useAppState();
  return (
    <HomeScreen
      posts={posts}
      loading={postsLoading}
      error={postsError}
      onRetry={reloadPosts}
      onPostClick={(post) => router.push(`/posts?id=${encodeURIComponent(post.id)}`)}
      onNotifications={() => router.push("/notifications")}
    />
  );
}
