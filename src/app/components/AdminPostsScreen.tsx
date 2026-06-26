import { useMemo, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import type { AdminPost } from "@/lib/admin";
import { AdminPage, AsyncState, SearchBox } from "./AdminUsersScreen";

export function AdminPostsScreen({ posts, loading, error, onBack, onRetry, onRemove, onFeature }: {
  posts: AdminPost[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onRetry: () => void;
  onRemove: (id: string) => Promise<{ error?: string }>;
  onFeature: (id: string, featured: boolean) => Promise<{ error?: string }>;
}) {
  const [query, setQuery] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const [featuring, setFeaturing] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const filtered = useMemo(() => posts.filter((post) => `${post.title} ${post.ownerName} ${post.category}`.toLowerCase().includes(query.toLowerCase())), [posts, query]);

  const remove = async (id: string) => {
    setRemoving(id);
    setActionError(null);
    const result = await onRemove(id);
    setRemoving(null);
    if (result.error) setActionError(result.error);
  };

  const feature = async (post: AdminPost) => {
    setFeaturing(post.id);
    setActionError(null);
    const result = await onFeature(post.id, !post.isFeatured);
    setFeaturing(null);
    if (result.error) setActionError(result.error);
  };

  return (
    <AdminPage title="Manage Posts" subtitle={`${posts.length} active posts`} onBack={onBack}>
      <SearchBox value={query} onChange={setQuery} placeholder="Search posts or owners..." />
      {actionError && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-destructive">{actionError}</p>}
      <AsyncState loading={loading} error={error} empty={!filtered.length} onRetry={onRetry} emptyText="No posts found." />
      {!loading && !error && (
        <div className="flex flex-col gap-3">
          {filtered.map((post) => (
            <div key={post.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs capitalize text-blue-700">{post.type}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">{post.mode}</span>
                    {post.isFeatured && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Featured</span>}
                  </div>
                  <h2 className="font-semibold">{post.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">by {post.ownerName} / {post.category} / {formatDate(post.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={featuring === post.id}
                    aria-label={post.isFeatured ? "Remove featured post" : "Feature post"}
                    onClick={() => void feature(post)}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${post.isFeatured ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}
                  >
                    <Star size={16} fill={post.isFeatured ? "currentColor" : "none"} />
                  </button>
                  <button disabled={removing === post.id} aria-label="Remove post" onClick={() => void remove(post.id)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-destructive">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPage>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
