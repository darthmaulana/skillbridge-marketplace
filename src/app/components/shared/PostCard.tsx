import { MapPin, Clock, Shield, Star, Wifi, Users } from "lucide-react";

export interface Post {
  id: string;
  userId: string;
  type: "job" | "skill";
  mode: "online" | "offline";
  title: string;
  description: string;
  budget: string;
  category: string;
  location: string;
  userName: string;
  verified: boolean;
  postedAt: string;
  createdAt: string;
  avatar: string;
  owner?: boolean;
  imageUrl?: string;
  exactLocation?: string;
  deadline?: string;
  requiredSkills?: string[];
  portfolioUrl?: string;
  authorLocation?: string;
  featured?: boolean;
}

interface Props {
  post: Post;
  onClick?: () => void;
}

const categoryColors: Record<string, string> = {
  "Design": "bg-[#e8d9ff] text-foreground",
  "Tech": "bg-[#d6f0ea] text-foreground",
  "Writing": "bg-[#fff0b8] text-foreground",
  "Marketing": "bg-[#ffd9df] text-foreground",
  "Education": "bg-[#dff4c7] text-foreground",
  "Repair": "bg-[#ffd8b8] text-foreground",
  "Cleaning": "bg-[#c9f1e7] text-foreground",
  "Transport": "bg-[#dce3ff] text-foreground",
};

export function PostCard({ post, onClick }: Props) {
  const catColor = categoryColors[post.category] ?? "bg-muted text-foreground";

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border-2 border-foreground p-4 text-left transition-transform active:translate-x-[2px] active:translate-y-[2px] ${post.featured ? "bg-[#fff0b8] shadow-[5px_5px_0_#26231d]" : "bg-card shadow-[4px_4px_0_#26231d]"}`}
    >
      {/* Top row: badges */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`rounded-full border border-foreground px-2.5 py-0.5 text-xs ${post.type === "job" ? "bg-accent text-foreground" : "bg-[#dff4c7] text-foreground"}`} style={{ fontWeight: 700 }}>
          {post.type === "job" ? "Job" : "Skill"}
        </span>
        <span className={`flex items-center gap-1 rounded-full border border-foreground px-2.5 py-0.5 text-xs ${post.mode === "online" ? "bg-[#d6f0ea] text-foreground" : "bg-[#ffd8b8] text-foreground"}`} style={{ fontWeight: 600 }}>
          {post.mode === "online" ? <Wifi size={10} /> : <Users size={10} />}
          {post.mode === "online" ? "Online" : "Offline"}
        </span>
        {post.featured && (
          <span className="flex items-center gap-1 rounded-full border border-foreground bg-[#f3c969] px-2.5 py-0.5 text-xs text-foreground" style={{ fontWeight: 700 }}>
            <Star size={10} fill="currentColor" />Featured
          </span>
        )}
        <span className={`ml-auto rounded-full border border-foreground px-2.5 py-0.5 text-xs ${catColor}`} style={{ fontWeight: 600 }}>
          {post.category}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-foreground leading-snug mb-1 line-clamp-1" style={{ fontWeight: 600 }}>{post.title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-3">{post.description}</p>

      {/* Budget */}
      <div className="mb-3 text-primary" style={{ fontWeight: 800, fontSize: "1.05rem" }}>{post.budget}</div>

      {/* Footer */}
      <div className="flex items-center gap-3 border-t-2 border-foreground pt-3">
        <div className="avatar-fallback flex h-7 w-7 items-center justify-center rounded-full text-xs" style={{ fontWeight: 700 }}>
          {post.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm text-foreground truncate" style={{ fontWeight: 500 }}>{post.userName}</span>
            {post.verified && <Shield size={13} className="text-emerald-500 flex-shrink-0" />}
          </div>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground text-xs">
          <span className="flex items-center gap-0.5"><MapPin size={11} />{post.location}</span>
          <span className="flex items-center gap-0.5"><Clock size={11} />{post.postedAt}</span>
        </div>
      </div>
    </button>
  );
}
