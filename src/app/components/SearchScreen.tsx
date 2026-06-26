import { useState } from "react";
import { Search, X, TrendingUp } from "lucide-react";
import { PostCard, Post } from "./shared/PostCard";

const TRENDING = ["Logo design", "Web development", "Home repair", "Translation", "Math tutor", "House cleaning"];

interface Props {
  posts: Post[];
  onPostClick: (post: Post) => void;
}

export function SearchScreen({ posts, onPostClick }: Props) {
  const [query, setQuery] = useState("");
  const results = query.length > 1 ? posts
    .filter((post) => [post.title, post.description, post.category, post.location].some((value) => value.toLowerCase().includes(query.toLowerCase())))
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }) : [];

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="bg-card border-b border-border px-4 pt-12 pb-4">
        <h1 style={{ fontWeight: 700, fontSize: "1.2rem" }} className="mb-4">Search</h1>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs, skills, categories..."
            className="w-full bg-muted pl-11 pr-10 py-3 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={16} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {query.length < 2 ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-muted-foreground" />
              <span className="text-muted-foreground text-sm" style={{ fontWeight: 600 }}>Trending searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map((t) => (
                <button key={t} onClick={() => setQuery(t)} className="px-3.5 py-2 bg-card border border-border rounded-full text-sm text-foreground active:bg-muted">
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-foreground" style={{ fontWeight: 600 }}>No results for "{query}"</p>
            <p className="text-muted-foreground text-sm mt-1">Try different keywords</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm" style={{ fontWeight: 500 }}>{results.length} result{results.length !== 1 ? "s" : ""} for "{query}"</p>
            {results.map((post) => (
              <PostCard key={post.id} post={post} onClick={() => onPostClick(post)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
