import { AlertTriangle, Calendar, ChevronLeft, Clock, CreditCard, ExternalLink, Flag, Link2, MapPin, MessageCircle, Shield, Users, Wifi } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Post } from "./shared/PostCard";

interface Props {
  post: Post;
  onBack: () => void;
  onChat: () => Promise<string | void>;
  onReport: () => void;
  onVerify: () => void;
  onProfile: () => void;
  isViewerVerified: boolean;
}

export function PostDetailScreen({ post, onBack, onChat, onReport, onVerify, onProfile, isViewerVerified }: Props) {
  const [openingChat, setOpeningChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const offlineContactAllowed = post.mode === "online" || (isViewerVerified && post.verified);
  const canContact = !post.owner && offlineContactAllowed;
  const visibleLocation = post.mode === "offline" && offlineContactAllowed ? post.exactLocation || post.location : post.location;

  const contactLabel = post.owner
    ? "This is your post"
    : openingChat
      ? "Opening Chat..."
    : post.mode === "offline" && !isViewerVerified
      ? "Verify to Contact"
      : post.mode === "offline" && !post.verified
        ? "Poster Not Verified"
        : "Contact / Chat";

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="relative h-48 flex-shrink-0 overflow-hidden bg-accent">
        {post.imageUrl ? (
          <img src={post.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-7xl font-bold text-foreground/20">{post.avatar}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        <button onClick={onBack} aria-label="Back" className="absolute left-4 top-12 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm"><ChevronLeft size={20} className="text-white" /></button>
        <button onClick={onReport} aria-label="Report post" className="absolute right-4 top-12 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm"><Flag size={18} className="text-white" /></button>
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Badge className={post.type === "job" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}>{post.type === "job" ? "Job" : "Skill"}</Badge>
          <Badge className={post.mode === "online" ? "bg-sky-100 text-sky-700" : "bg-orange-100 text-orange-700"}>
            {post.mode === "online" ? <Wifi size={10} /> : <Users size={10} />}{post.mode === "online" ? "Online" : "Offline"}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-44">
        <div className="-mt-4 rounded-t-3xl bg-card px-5 pb-4 pt-6 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h1 className="flex-1 text-foreground" style={{ fontWeight: 700, fontSize: "1.2rem", lineHeight: 1.35 }}>{post.title}</h1>
            <span className="flex-shrink-0 text-primary" style={{ fontWeight: 800, fontSize: "1.1rem" }}>{post.budget}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin size={13} />{visibleLocation}</span>
            <span className="flex items-center gap-1"><Clock size={13} />{post.postedAt}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{post.category}</span>
          </div>
        </div>

        <div className="px-5 pt-4">
          {!post.owner && (
            <DetailCard title="Safe payment">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-foreground bg-[#f3c969]">
                  <CreditCard size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Book through SkillBridge</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Chat first, agree on the work and price, then the post owner can send you a bill. Pay only through the bill inside SkillBridge.
                  </p>
                </div>
              </div>
            </DetailCard>
          )}

          {post.mode === "offline" && (
            <div className="mb-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-sm text-amber-800" style={{ fontWeight: 600 }}>Offline work - stay safe</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-700">Meet in a public place first. Do not share payment details or a precise home address before trust is established.</p>
              </div>
            </div>
          )}

          <DetailCard title="Description">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{post.description}</p>
          </DetailCard>

          {(post.deadline || post.requiredSkills?.length || post.portfolioUrl) && (
            <DetailCard title={post.type === "job" ? "Job details" : "Service details"}>
              <div className="flex flex-col gap-3">
                {post.deadline && <DetailRow icon={<Calendar size={16} />} label="Deadline" value={new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${post.deadline}T00:00:00`))} />}
                {post.requiredSkills && post.requiredSkills.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Required skills</p>
                    <div className="flex flex-wrap gap-2">{post.requiredSkills.map((skill) => <span key={skill} className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground">{skill}</span>)}</div>
                  </div>
                )}
                {post.portfolioUrl && (
                  <a href={post.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary">
                    <Link2 size={16} />View portfolio <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </DetailCard>
          )}

          <DetailCard title="Posted by">
            <button onClick={onProfile} className="flex w-full items-center gap-3 text-left">
              <div className="avatar-fallback flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold">{post.avatar}</div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-foreground">{post.userName}</span>
                  {post.verified && <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600"><Shield size={11} />Verified for Offline Jobs</span>}
                </div>
                <div className="mt-1 flex items-center gap-3">
                  {post.authorLocation && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={11} />{post.authorLocation}</span>}
                </div>
              </div>
              <ChevronLeft size={18} className="rotate-180 text-muted-foreground" />
            </button>
          </DetailCard>

          {post.mode === "offline" && !offlineContactAllowed && (
            <div className="mb-4 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <Shield size={18} className="mt-0.5 flex-shrink-0 text-primary" />
              <div>
                <p className="text-sm text-primary" style={{ fontWeight: 600 }}>{!isViewerVerified ? "Verification required" : "The poster is not verified"}</p>
                <p className="mt-1 text-xs leading-relaxed text-blue-700">
                  {!isViewerVerified ? "Verify your identity to contact people about offline work and reveal the job location." : "Offline contact remains unavailable until both accounts are verified."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-md flex-col gap-2 border-t border-border bg-card px-4 pb-4 pt-3" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
        <div className="flex gap-3">
          <button onClick={onReport} aria-label="Report post" className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-border"><Flag size={18} className="text-muted-foreground" /></button>
          <button
            onClick={post.mode === "offline" && !isViewerVerified ? onVerify : async () => {
              setOpeningChat(true);
              setChatError(null);
              const error = await onChat();
              if (error) setChatError(error);
              setOpeningChat(false);
            }}
            disabled={openingChat || (!canContact && !(post.mode === "offline" && !isViewerVerified && !post.owner))}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 ${canContact || (post.mode === "offline" && !isViewerVerified && !post.owner) ? "bg-accent text-foreground" : "cursor-not-allowed bg-muted text-muted-foreground"}`}
            style={{ fontWeight: 600 }}
          >
            {post.mode === "offline" && !isViewerVerified ? <Shield size={18} /> : <MessageCircle size={18} />}
            {contactLabel}
          </button>
        </div>
      </div>
      {chatError && <div className="fixed bottom-20 left-4 right-4 mx-auto max-w-sm rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-destructive shadow-sm">{chatError}</div>}
    </div>
  );
}

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${className}`} style={{ fontWeight: 600 }}>{children}</span>;
}

function DetailCard({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mb-4 rounded-2xl border border-border bg-card p-4"><h2 className="mb-2 text-sm text-muted-foreground" style={{ fontWeight: 600 }}>{title}</h2>{children}</section>;
}

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">{icon}</span><span className="text-muted-foreground">{label}</span><span className="ml-auto font-medium text-foreground">{value}</span></div>;
}


