import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Camera, ChevronLeft, Link2, MapPin, Save, UserRound, X } from "lucide-react";
import type { ProfileResult, UpdateProfileInput, UserProfile } from "@/lib/auth";

interface Props {
  profile: UserProfile;
  onBack: () => void;
  onSubmit: (input: UpdateProfileInput) => Promise<ProfileResult>;
}

export function EditProfileScreen({ profile, onBack, onSubmit }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(profile.full_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [skills, setSkills] = useState(profile.skills.join(", "));
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolio_url ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!avatar) {
      setAvatarPreview(profile.avatar_url);
      return;
    }
    const previewUrl = URL.createObjectURL(avatar);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatar, profile.avatar_url]);

  const save = async () => {
    if (submitting) return;
    const parsedSkills = [...new Set(skills.split(",").map((skill) => skill.trim()).filter(Boolean))].slice(0, 12);
    setSubmitting(true);
    setError(null);
    const result = await onSubmit({
      fullName,
      bio,
      skills: parsedSkills,
      portfolioUrl,
      location,
      avatar: avatar ?? undefined,
    });
    setSubmitting(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 pb-4 pt-12">
        <button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><ChevronLeft size={20} /></button>
        <h1 className="flex-1 text-lg font-bold">Edit Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-card p-5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => setAvatar(event.target.files?.[0] ?? null)}
            />
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile preview" className="h-20 w-20 rounded-2xl object-cover" />
              ) : (
                <div className="avatar-fallback flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold">
                  {fullName.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="flex-1">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white">
                  <Camera size={15} />Choose Photo
                </button>
                <p className="mt-2 text-xs text-muted-foreground">JPG, PNG, or WebP up to 3 MB</p>
              </div>
              {avatar && <button onClick={() => setAvatar(null)} aria-label="Remove selected photo" className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><X size={15} /></button>}
            </div>
          </section>

          <Field icon={<UserRound size={17} />} label="Full name *">
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} maxLength={80} className="field" placeholder="Your full name" />
          </Field>

          <Field icon={<UserRound size={17} />} label="Bio">
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={500} rows={5} className="field resize-none" placeholder="Tell people about your experience and services" />
            <p className="mt-1 text-right text-xs text-muted-foreground">{bio.length}/500</p>
          </Field>

          <Field icon={<UserRound size={17} />} label="Skills">
            <input value={skills} onChange={(event) => setSkills(event.target.value)} className="field" placeholder="Figma, Plumbing, Translation" />
            <p className="mt-1 text-xs text-muted-foreground">Separate skills with commas. Up to 12 will be saved.</p>
          </Field>

          <Field icon={<Link2 size={17} />} label="Portfolio link">
            <input value={portfolioUrl} onChange={(event) => setPortfolioUrl(event.target.value)} type="url" className="field" placeholder="https://your-portfolio.com" />
          </Field>

          <Field icon={<MapPin size={17} />} label="Location">
            <input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={120} className="field" placeholder="City, country" />
          </Field>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-800">
            Your email and identity verification documents are private. Public profiles only show the fields on this form plus verification status.
          </div>

          {error && <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-destructive"><AlertCircle size={17} className="mt-0.5 flex-shrink-0" />{error}</div>}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-border bg-card px-4 pb-4 pt-4" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
        <button disabled={submitting || fullName.trim().length < 2} onClick={save} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-white disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground">
          <Save size={18} />{submitting ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <section className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="mt-1 flex-shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <label className="mb-2 block text-sm text-muted-foreground">{label}</label>
        {children}
      </div>
    </section>
  );
}

