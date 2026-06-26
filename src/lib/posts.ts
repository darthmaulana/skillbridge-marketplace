import type { Post } from "@/app/components/shared/PostCard";

export interface CreatePostInput {
  type: "job" | "skill";
  mode: "online" | "offline";
  title: string;
  description: string;
  category: string;
  price: number;
  location: string;
  deadline?: string;
  requiredSkills: string[];
  portfolioUrl?: string;
  image?: File;
}

export interface CreatePostResult {
  post?: Post;
  error?: string;
}

interface PostRow {
  id: string;
  user_id: string;
  post_type: "job" | "skill";
  title: string;
  description: string;
  category: string;
  budget_or_price: number;
  work_type: "online" | "offline";
  location: string | null;
  deadline?: string | null;
  required_skills?: string[] | null;
  portfolio_url?: string | null;
  image_url?: string | null;
  is_featured?: boolean | null;
  created_at: string;
}

interface PublicProfileRow {
  id: string;
  full_name: string;
  avatar_url: string | null;
  location?: string | null;
  verification_status: "unverified" | "pending" | "approved" | "rejected";
}

export function formatRelativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

export function mapPostRows(rows: PostRow[], profiles: PublicProfileRow[], currentUserId?: string): Post[] {
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return rows.map((row) => {
    const author = profileById.get(row.user_id);
    const userName = author?.full_name || "SkillBridge user";
    const amount = Number(row.budget_or_price).toLocaleString("id-ID");

    return {
      id: row.id,
      userId: row.user_id,
      type: row.post_type,
      mode: row.work_type,
      title: row.title,
      description: row.description,
      budget: `${row.post_type === "skill" ? "From " : ""}Rp ${amount}`,
      category: row.category,
      location: row.work_type === "online" ? row.location || "Remote" : "Location shared after verification",
      userName,
      verified: author?.verification_status === "approved",
      postedAt: formatRelativeTime(row.created_at),
      createdAt: row.created_at,
      avatar: userName.charAt(0).toUpperCase(),
      owner: row.user_id === currentUserId,
      imageUrl: row.image_url ?? undefined,
      featured: Boolean(row.is_featured),
      exactLocation: row.location ?? undefined,
      deadline: row.deadline ?? undefined,
      requiredSkills: row.required_skills ?? [],
      portfolioUrl: row.portfolio_url ?? undefined,
      authorLocation: author?.location ?? undefined,
    };
  });
}
