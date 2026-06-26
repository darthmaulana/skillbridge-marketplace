import { useRef, useState, type ReactNode } from "react";
import { AlertCircle, Briefcase, Calendar, ChevronLeft, Link2, MapPin, Star, Upload, Users, Wifi, X } from "lucide-react";
import type { CreatePostInput, CreatePostResult } from "@/lib/posts";

interface Props {
  onBack: () => void;
  onVerify: () => void;
  onSubmit: (input: CreatePostInput) => Promise<CreatePostResult>;
  isVerified: boolean;
}

const CATEGORIES = ["Design", "Tech", "Writing", "Marketing", "Education", "Repair", "Cleaning", "Transport", "Etc"];

export function CreatePostScreen({ onBack, onVerify, onSubmit, isVerified }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [postType, setPostType] = useState<"job" | "skill" | null>(null);
  const [mode, setMode] = useState<"online" | "offline">("online");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [verificationPrompt, setVerificationPrompt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!postType) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 border-b border-border bg-card px-4 pb-4 pt-12">
          <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><ChevronLeft size={20} /></button>
          <h1 style={{ fontWeight: 700, fontSize: "1.1rem" }}>Create Post</h1>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
          <p className="text-center text-sm text-muted-foreground">What kind of post would you like to create?</p>
          <PostTypeButton type="job" title="Job Post" description="I need someone to do a job for me" onClick={() => setPostType("job")} />
          <PostTypeButton type="skill" title="Skill Post" description="I offer a skill and want to find work" onClick={() => setPostType("skill")} />
        </div>
      </div>
    );
  }

  const isJob = postType === "job";
  const numericPrice = Number(price);
  const resolvedCategory = category === "Etc" ? customCategory.trim() : category;
  const canPublish = title.trim().length >= 5
    && description.trim().length >= 20
    && resolvedCategory
    && numericPrice > 0
    && (mode === "online" || location.trim());
  const publishHint = getPublishHint({
    title,
    description,
    category,
    customCategory,
    price: numericPrice,
    mode,
    location,
  });

  const publish = async () => {
    if (!canPublish || submitting) return;
    if (portfolioUrl && !/^https?:\/\//i.test(portfolioUrl)) {
      setError("Portfolio link must start with http:// or https://.");
      return;
    }
    if (image && image.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await onSubmit({
      type: postType,
      mode,
      title: title.trim(),
      description: description.trim(),
      category: resolvedCategory,
      price: numericPrice,
      location: location.trim(),
      deadline: isJob ? deadline || undefined : undefined,
      requiredSkills: isJob ? requiredSkills.split(",").map((skill) => skill.trim()).filter(Boolean) : [],
      portfolioUrl: !isJob ? portfolioUrl.trim() || undefined : undefined,
      image: image ?? undefined,
    });
    setSubmitting(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 pb-4 pt-12">
        <button onClick={() => setPostType(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><ChevronLeft size={20} /></button>
        <h1 className="flex-1" style={{ fontWeight: 700, fontSize: "1.1rem" }}>{isJob ? "Create Job Post" : "Create Skill Post"}</h1>
        <span className={`rounded-full px-2.5 py-1 text-xs ${isJob ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`} style={{ fontWeight: 600 }}>{isJob ? "Job" : "Skill"}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4">
        <div className="flex flex-col gap-4">
          <Section label="Service mode">
            <div className="flex gap-3">
              {(["online", "offline"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    if (item === "offline" && !isVerified) {
                      setVerificationPrompt(true);
                      return;
                    }
                    setVerificationPrompt(false);
                    setMode(item);
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 ${mode === item ? item === "online" ? "border-sky-400 bg-sky-50 text-sky-700" : "border-orange-400 bg-orange-50 text-orange-700" : "border-border text-muted-foreground"}`}
                >
                  {item === "online" ? <Wifi size={16} /> : <Users size={16} />}
                  <span className="text-sm capitalize">{item}</span>
                  {item === "offline" && !isVerified && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">Verify first</span>}
                </button>
              ))}
            </div>
            {verificationPrompt && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Offline posts require approved KTP verification.
                <button onClick={onVerify} className="ml-1 font-semibold underline">Verify now</button>
              </div>
            )}
          </Section>

          <Section label={`${isJob ? "Job" : "Skill"} title *`}>
            <input value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} placeholder={isJob ? "e.g. Fix leaking pipe in bathroom" : "e.g. Professional logo design"} className="field" />
          </Section>

          <Section label="Description *">
            <textarea value={description} maxLength={2000} onChange={(event) => setDescription(event.target.value)} rows={5} placeholder="Describe the work, requirements, and expected result..." className="field resize-none" />
            <p className="mt-1 text-right text-xs text-muted-foreground">{description.length}/2000</p>
          </Section>

          <Section label="Category *">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((item) => (
                <button key={item} onClick={() => setCategory(item)} className={`rounded-full border px-3 py-1.5 text-sm ${category === item ? "border-primary bg-primary text-white" : "border-border text-muted-foreground"}`}>{item}</button>
              ))}
            </div>
            {category === "Etc" && (
              <input
                value={customCategory}
                onChange={(event) => setCustomCategory(event.target.value)}
                maxLength={40}
                placeholder="Type category, e.g. Event help"
                className="field mt-3"
              />
            )}
          </Section>

          <Section label={`${isJob ? "Budget" : "Price/rate"} (Rp) *`}>
            <input value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="1" placeholder="e.g. 250000" className="field" />
          </Section>

          {isJob ? (
            <>
              <IconSection icon={<Calendar size={18} />} label="Deadline">
                <input value={deadline} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDeadline(event.target.value)} type="date" className="field" />
              </IconSection>
              <Section label="Required skills (comma separated)">
                <input value={requiredSkills} onChange={(event) => setRequiredSkills(event.target.value)} placeholder="e.g. Plumbing, Pipe fitting, Tools" className="field" />
              </Section>
            </>
          ) : (
            <IconSection icon={<Link2 size={18} />} label="Portfolio link">
              <input value={portfolioUrl} onChange={(event) => setPortfolioUrl(event.target.value)} type="url" placeholder="https://your-portfolio.com" className="field" />
            </IconSection>
          )}

          <IconSection icon={<MapPin size={18} />} label={`Location ${mode === "offline" ? "*" : "(optional)"}`}>
            <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder={mode === "online" ? "Remote / anywhere" : "e.g. Jakarta Selatan"} className="field" />
          </IconSection>

          <div className="rounded-2xl border border-dashed border-border bg-card p-4">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
            {image ? (
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50"><Upload size={20} className="text-emerald-600" /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{image.name}</p><p className="text-xs text-muted-foreground">{(image.size / 1024 / 1024).toFixed(1)} MB</p></div>
                <button onClick={() => setImage(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><X size={15} /></button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center gap-2 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted"><Upload size={22} className="text-muted-foreground" /></div>
                <p className="text-sm font-medium">Add photo (optional)</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, or WebP up to 5 MB</p>
              </button>
            )}
          </div>

          {mode === "offline" && (
            <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <Users size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
              <p className="text-xs leading-relaxed text-amber-700">Exact location and contact details should only be shared after both parties are verified. Meet in a public place first.</p>
            </div>
          )}

          {error && <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-destructive"><AlertCircle size={17} className="mt-0.5 flex-shrink-0" />{error}</div>}
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-card px-4 pb-4 pt-4" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
        <button disabled={!canPublish || submitting} onClick={publish} className={`w-full rounded-2xl py-4 ${canPublish && !submitting ? "bg-primary text-white" : "cursor-not-allowed bg-muted text-muted-foreground"}`} style={{ fontWeight: 600 }}>
          {submitting ? "Publishing..." : isJob ? "Publish Job" : "Publish Skill"}
        </button>
        {!canPublish && <p className="mt-2 text-center text-xs text-muted-foreground">{publishHint}</p>}
      </div>
    </div>
  );
}

function PostTypeButton({ type, title, description, onClick }: { type: "job" | "skill"; title: string; description: string; onClick: () => void }) {
  const isJob = type === "job";
  return (
    <button onClick={onClick} className={`flex w-full items-start gap-4 rounded-2xl border-2 bg-card p-6 ${isJob ? "border-primary/20" : "border-emerald-200"}`}>
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${isJob ? "bg-blue-100 text-primary" : "bg-emerald-100 text-emerald-600"}`}>{isJob ? <Briefcase size={24} /> : <Star size={24} />}</div>
      <div className="text-left"><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
    </button>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-4"><label className="mb-2 block text-sm text-muted-foreground">{label}</label>{children}</div>;
}

function IconSection({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"><span className="mt-0.5 flex-shrink-0 text-muted-foreground">{icon}</span><div className="flex-1"><label className="mb-2 block text-sm text-muted-foreground">{label}</label>{children}</div></div>;
}

function getPublishHint({
  title,
  description,
  category,
  customCategory,
  price,
  mode,
  location,
}: {
  title: string;
  description: string;
  category: string;
  customCategory: string;
  price: number;
  mode: "online" | "offline";
  location: string;
}) {
  if (title.trim().length < 5) return "Add a title with at least 5 characters.";
  if (description.trim().length < 20) return "Write a description with at least 20 characters.";
  if (!category) return "Choose a category.";
  if (category === "Etc" && !customCategory.trim()) return "Type your custom category.";
  if (!price || price <= 0) return "Enter a budget or price greater than 0.";
  if (mode === "offline" && !location.trim()) return "Add a location for offline work.";
  return "Complete the required fields to publish.";
}

