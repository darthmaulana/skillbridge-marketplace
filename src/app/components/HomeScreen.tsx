import { useEffect, useState } from "react";
import { AlertCircle, Bell, ChevronDown, SlidersHorizontal, Star, X } from "lucide-react";
import { PostCard, type Post } from "./shared/PostCard";

const FILTER_CHIPS = ["All", "Jobs", "Skills", "Online", "Offline"];
const CATEGORIES = ["All", "Design", "Tech", "Writing", "Education", "Repair", "Cleaning", "Transport", "Marketing"];
const SORT_OPTIONS = ["Newest", "Oldest", "Highest Price"] as const;

type SortOption = typeof SORT_OPTIONS[number];

interface Props {
  posts: Post[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onPostClick: (post: Post) => void;
  onNotifications: () => void;
}

export function HomeScreen({ posts, loading = false, error, onRetry, onPostClick, onNotifications }: Props) {
  const [greeting, setGreeting] = useState(() => getTimeGreeting());
  const [dismissedFeaturedIds, setDismissedFeaturedIds] = useState<Set<string>>(() => loadDismissedFeaturedIds());
  const [filter, setFilter] = useState("All");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("Newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    const updateGreeting = () => setGreeting(getTimeGreeting());
    updateGreeting();
    const intervalId = window.setInterval(updateGreeting, 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const filtered = posts
    .filter((post) => {
      if (filter === "Jobs" && post.type !== "job") return false;
      if (filter === "Skills" && post.type !== "skill") return false;
      if (filter === "Online" && post.mode !== "online") return false;
      if (filter === "Offline" && post.mode !== "offline") return false;
      if (category !== "All" && post.category !== category) return false;
      if (search) {
        const query = search.toLowerCase();
        if (![post.title, post.description, post.category, post.location].some((value) => value.toLowerCase().includes(query))) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (sortBy === "Oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "Highest Price") return parsePrice(b.budget) - parsePrice(a.budget);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  const featuredPost = posts
    .filter((post) => post.featured && !dismissedFeaturedIds.has(post.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const dismissFeatured = (postId: string) => {
    setDismissedFeaturedIds((current) => {
      const next = new Set(current);
      next.add(postId);
      saveDismissedFeaturedIds(next);
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b-2 border-foreground bg-accent px-4 pb-6 pt-12 lg:shadow-[0_4px_0_#26231d]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">{greeting}</p>
            <h2 className="text-foreground" style={{ fontWeight: 800, fontSize: "1.2rem" }}>What are you looking for?</h2>
          </div>
          <button onClick={onNotifications} aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground bg-card">
            <Bell size={20} className="text-foreground" />
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border border-foreground bg-[#f49080]" />
          </button>
        </div>
        <div className="relative">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search jobs, skills, categories..."
            className="w-full rounded-2xl border-2 border-foreground bg-card py-3 pl-4 pr-12 text-sm text-foreground shadow-[5px_5px_0_#26231d] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            aria-expanded={showFilters}
            aria-label={showFilters ? "Hide filters" : "Show filters"}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl border-2 border-foreground bg-[#f3c969]"
          >
            <SlidersHorizontal size={15} className="text-foreground" />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="border-b-2 border-foreground bg-card">
          <div className="scrollbar-none flex gap-2 overflow-x-auto px-4 py-3">
            {FILTER_CHIPS.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`flex-shrink-0 rounded-full border-2 border-foreground px-3.5 py-1.5 text-sm shadow-[2px_2px_0_#26231d] transition-colors ${filter === item ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                style={{ fontWeight: filter === item ? 600 : 400 }}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="scrollbar-none flex gap-2 overflow-x-auto px-4 pb-3">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${category === item ? "border-foreground bg-accent text-accent-foreground" : "border-foreground/40 bg-transparent text-muted-foreground"}`}
                style={{ fontWeight: category === item ? 600 : 400 }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-24 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filtered.length} available post{filtered.length === 1 ? "" : "s"}</p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSortMenu((current) => !current)}
              aria-expanded={showSortMenu}
              className="flex items-center gap-1 rounded-full border border-foreground bg-card px-3 py-1.5 text-xs text-foreground shadow-[2px_2px_0_#26231d]"
              style={{ fontWeight: 600 }}
            >
              {sortBy} <ChevronDown size={13} className={showSortMenu ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-2xl border-2 border-foreground bg-card shadow-[4px_4px_0_#26231d]">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortBy(option);
                      setShowSortMenu(false);
                    }}
                    className={`block w-full px-3 py-2.5 text-left text-xs ${sortBy === option ? "bg-primary text-primary-foreground" : "text-foreground active:bg-muted"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-2xl border-2 border-foreground bg-card p-4 shadow-[4px_4px_0_#26231d]">
              <div className="mb-4 flex gap-2"><div className="h-5 w-14 rounded-full bg-muted" /><div className="h-5 w-16 rounded-full bg-muted" /></div>
              <div className="mb-2 h-5 w-3/4 rounded bg-muted" />
              <div className="mb-2 h-4 w-full rounded bg-muted" />
              <div className="mb-5 h-4 w-2/3 rounded bg-muted" />
              <div className="border-t border-border pt-3"><div className="h-4 w-1/2 rounded bg-muted" /></div>
            </div>
          ))
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-foreground bg-red-50 px-6 py-12 text-center shadow-[4px_4px_0_#26231d]">
            <AlertCircle size={28} className="text-destructive" />
            <p className="mt-3 text-foreground" style={{ fontWeight: 600 }}>Could not load posts</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <button onClick={onRetry} className="mt-4 rounded-xl border-2 border-foreground bg-primary px-5 py-2.5 text-sm text-primary-foreground shadow-[3px_3px_0_#26231d]">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-foreground bg-muted shadow-[3px_3px_0_#26231d]">
              <SlidersHorizontal size={28} className="text-muted-foreground" />
            </div>
            <p className="text-foreground" style={{ fontWeight: 600 }}>No results found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          filtered.map((post) => <PostCard key={post.id} post={post} onClick={() => onPostClick(post)} />)
        )}
      </div>

      {!loading && !error && featuredPost && (
        <div className="fixed inset-0 z-[70] mx-auto flex max-w-md items-center justify-center bg-[#26231d]/55 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Featured post">
          <div className="w-full rounded-3xl border-2 border-foreground bg-card p-5 shadow-[8px_8px_0_#26231d]">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-foreground bg-[#f3c969] text-foreground shadow-[3px_3px_0_#26231d]">
                <Star size={22} fill="currentColor" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Featured post</p>
                <h3 className="mt-1 text-lg font-bold leading-snug text-foreground">{featuredPost.title}</h3>
              </div>
              <button onClick={() => dismissFeatured(featuredPost.id)} aria-label="Close featured post" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-foreground bg-muted">
                <X size={17} />
              </button>
            </div>
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{featuredPost.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-foreground bg-accent px-2.5 py-1 text-foreground">{featuredPost.type === "job" ? "Job" : "Skill"}</span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{featuredPost.category}</span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">{featuredPost.budget}</span>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => dismissFeatured(featuredPost.id)} className="flex-1 rounded-2xl border-2 border-foreground py-3 text-sm font-semibold text-foreground">Later</button>
              <button
                onClick={() => {
                  dismissFeatured(featuredPost.id);
                  onPostClick(featuredPost);
                }}
                className="flex-1 rounded-2xl border-2 border-foreground bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[3px_3px_0_#26231d]"
              >
                View Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function parsePrice(value: string) {
  const numeric = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

function loadDismissedFeaturedIds() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    return new Set(JSON.parse(sessionStorage.getItem("skillbridge-dismissed-featured") || "[]") as string[]);
  } catch {
    sessionStorage.removeItem("skillbridge-dismissed-featured");
    return new Set<string>();
  }
}

function saveDismissedFeaturedIds(ids: Set<string>) {
  sessionStorage.setItem("skillbridge-dismissed-featured", JSON.stringify([...ids]));
}
