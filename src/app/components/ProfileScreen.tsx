import { ChevronLeft, ChevronRight, Edit2, ExternalLink, FileText, Flag, Info, Link2, LogOut, MapPin, Shield } from "lucide-react";
import type { PublicProfile } from "@/lib/auth";
import { PostCard, type Post } from "./shared/PostCard";

interface Props {
  profile: PublicProfile;
  posts: Post[];
  isOwnProfile?: boolean;
  onBack?: () => void;
  onEdit?: () => void;
  onVerify?: () => void;
  onLogout?: () => void;
  onReport?: () => void;
  onTerms?: () => void;
  onAbout?: () => void;
  onPostClick: (post: Post) => void;
}

const statusStyles = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  unverified: "border-slate-200 bg-slate-50 text-slate-600",
} as const;

const statusLabels = {
  approved: "Verified for Offline Jobs",
  pending: "Verification Pending",
  rejected: "Verification Rejected",
  unverified: "Not Verified",
} as const;

export function ProfileScreen({
  profile,
  posts,
  isOwnProfile = false,
  onBack,
  onEdit,
  onVerify,
  onLogout,
  onReport,
  onTerms,
  onAbout,
  onPostClick,
}: Props) {
  const userPosts = posts
    .filter((post) => post.userId === profile.id)
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  const initial = profile.full_name.charAt(0).toUpperCase();

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background pb-24">
      <div className="relative bg-primary px-4 pb-6 pt-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isOwnProfile && (
              <button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <ChevronLeft size={20} className="text-white" />
              </button>
            )}
            <h1 className="text-white text-lg font-bold">{isOwnProfile ? "My Profile" : "Profile"}</h1>
          </div>
          {isOwnProfile && (
            <button onClick={onEdit} className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm text-white">
              <Edit2 size={15} />Edit
            </button>
          )}
          {!isOwnProfile && onReport && (
            <button onClick={onReport} aria-label="Report user" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <Flag size={17} className="text-white" />
            </button>
          )}
        </div>
      </div>

      <section className="mx-4 mt-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-4">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={`${profile.full_name} profile`} className="h-[72px] w-[72px] rounded-2xl object-cover" />
          ) : (
            <div className="avatar-fallback flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-2xl text-2xl font-bold">{initial}</div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-foreground">{profile.full_name}</h2>
            <span className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${statusStyles[profile.verification_status]}`}>
              <Shield size={11} />{statusLabels[profile.verification_status]}
            </span>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {profile.bio || (isOwnProfile ? "Add a short bio so people know what you do." : "This user has not added a bio yet.")}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {profile.location && <span className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin size={13} />{profile.location}</span>}
          {profile.portfolio_url && (
            <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 break-all text-xs text-primary">
              <Link2 size={13} className="flex-shrink-0" />{profile.portfolio_url}<ExternalLink size={11} className="flex-shrink-0" />
            </a>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {profile.skills.length > 0 ? profile.skills.map((skill) => (
            <span key={skill} className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground">{skill}</span>
          )) : isOwnProfile && <span className="text-xs text-muted-foreground">Add skills to make your profile easier to discover.</span>}
        </div>
      </section>

      <section className="mx-4 mt-3 rounded-2xl border border-border bg-card p-4">
        <div className="text-center">
          <div className="text-xl font-bold text-foreground">{userPosts.length}</div>
          <div className="text-xs text-muted-foreground">Published posts</div>
        </div>
      </section>

      {isOwnProfile && profile.verification_status !== "approved" && (
        <div className="mx-4 mt-3">
          <button onClick={onVerify} className="flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100"><Shield size={20} className="text-amber-600" /></div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800">{profile.verification_status === "pending" ? "Verification is being reviewed" : "Verify for offline jobs"}</p>
              <p className="mt-0.5 text-xs text-amber-700">Check your status or submit identity verification.</p>
            </div>
            <ChevronRight size={18} className="text-amber-600" />
          </button>
        </div>
      )}

      {isOwnProfile && (
        <section className="mx-4 mt-3 rounded-2xl border border-border bg-card p-2">
          <button onClick={onAbout} className="flex w-full items-center gap-3 rounded-xl p-3 text-left active:bg-muted">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-foreground"><Info size={18} /></span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">About SkillBridge</p>
              <p className="text-xs text-muted-foreground">App information and contact number.</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
          <button onClick={onTerms} className="flex w-full items-center gap-3 rounded-xl p-3 text-left active:bg-muted">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff0b8] text-foreground"><FileText size={18} /></span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Terms and Conditions</p>
              <p className="text-xs text-muted-foreground">Rules for chat, payment, safety, and disputes.</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        </section>
      )}

      <section className="mx-4 mt-5">
        <h3 className="mb-3 font-bold text-foreground">{isOwnProfile ? "My Posts" : `${profile.full_name.split(" ")[0]}'s Posts`}</h3>
        <div className="flex flex-col gap-3">
          {userPosts.length > 0 ? userPosts.map((post) => (
            <PostCard key={post.id} post={post} onClick={() => onPostClick(post)} />
          )) : (
            <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
              No published posts yet.
            </div>
          )}
        </div>
      </section>

      {isOwnProfile && (
        <div className="mx-4 mb-4 mt-4">
          <button onClick={onLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 py-3.5 text-destructive">
            <LogOut size={18} />Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
