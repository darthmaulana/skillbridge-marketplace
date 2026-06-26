"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPostsScreen } from "@/app/components/AdminPostsScreen";
import { loadAdminPosts, removeAdminPost, setAdminPostFeatured, type AdminPost } from "@/lib/admin";

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const result = await loadAdminPosts();
    setLoading(false);
    if (result.error) setError(result.error);
    else setPosts(result.data ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <AdminPostsScreen posts={posts} loading={loading} error={error} onBack={() => router.push("/admin")} onRetry={() => void load()} onRemove={async (id) => {
    const result = await removeAdminPost(id);
    if (!result.error) await load();
    return result;
  }} onFeature={async (id, featured) => {
    const result = await setAdminPostFeatured(id, featured);
    if (!result.error) await load();
    return result;
  }} />;
}
