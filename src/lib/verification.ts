import type { VerificationStatus } from "@/app/data";
import type { UserProfile } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export interface VerificationRequest {
  id: string;
  legalName: string;
  ktpImagePath: string;
  selfieImagePath: string;
  status: VerificationStatus;
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface VerificationSubmission {
  legalName: string;
  ktpImage: File;
  selfieImage: File;
  consent: boolean;
}

export interface VerificationResult<T> {
  data?: T;
  error?: string;
}

interface VerificationRow {
  id: string;
  legal_name: string;
  ktp_image_path: string;
  selfie_image_path: string;
  status: VerificationStatus;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

const DEMO_VERIFICATION_KEY = "skillbridge-verification-request";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

export async function loadLatestVerification(profile: UserProfile): Promise<VerificationResult<VerificationRequest | null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const saved = localStorage.getItem(DEMO_VERIFICATION_KEY);
    if (!saved) return { data: null };
    try {
      return { data: JSON.parse(saved) as VerificationRequest };
    } catch {
      localStorage.removeItem(DEMO_VERIFICATION_KEY);
      return { data: null };
    }
  }

  const { data, error } = await supabase
    .from("verification_requests")
    .select("id,legal_name,ktp_image_path,selfie_image_path,status,rejection_reason,submitted_at,reviewed_at")
    .eq("user_id", profile.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { error: error.message };
  return { data: data ? mapVerificationRow(data as VerificationRow) : null };
}

export async function submitVerification(
  input: VerificationSubmission,
  profile: UserProfile,
): Promise<VerificationResult<VerificationRequest>> {
  const validationError = validateSubmission(input);
  if (validationError) return { error: validationError };

  const requestId = crypto.randomUUID();
  const submittedAt = new Date().toISOString();
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const request: VerificationRequest = {
      id: requestId,
      legalName: input.legalName.trim(),
      ktpImagePath: `private-demo/${requestId}/ktp`,
      selfieImagePath: `private-demo/${requestId}/selfie`,
      status: "pending",
      rejectionReason: null,
      submittedAt,
      reviewedAt: null,
    };
    localStorage.setItem(DEMO_VERIFICATION_KEY, JSON.stringify(request));
    return { data: request };
  }

  const ktpPath = `${profile.id}/${requestId}/ktp.${getExtension(input.ktpImage)}`;
  const selfiePath = `${profile.id}/${requestId}/selfie.${getExtension(input.selfieImage)}`;
  const uploadedPaths: string[] = [];

  const ktpUpload = await supabase.storage.from("verification-private").upload(ktpPath, input.ktpImage, {
    cacheControl: "3600",
    upsert: false,
  });
  if (ktpUpload.error) return { error: ktpUpload.error.message };
  uploadedPaths.push(ktpPath);

  const selfieUpload = await supabase.storage.from("verification-private").upload(selfiePath, input.selfieImage, {
    cacheControl: "3600",
    upsert: false,
  });
  if (selfieUpload.error) {
    await supabase.storage.from("verification-private").remove(uploadedPaths);
    return { error: selfieUpload.error.message };
  }
  uploadedPaths.push(selfiePath);

  const { data, error } = await supabase
    .from("verification_requests")
    .insert({
      id: requestId,
      user_id: profile.id,
      legal_name: input.legalName.trim(),
      ktp_image_path: ktpPath,
      selfie_image_path: selfiePath,
      status: "pending",
    })
    .select("id,legal_name,ktp_image_path,selfie_image_path,status,rejection_reason,submitted_at,reviewed_at")
    .single();

  if (error) {
    await supabase.storage.from("verification-private").remove(uploadedPaths);
    return { error: error.message };
  }
  return { data: mapVerificationRow(data as VerificationRow) };
}

function validateSubmission(input: VerificationSubmission) {
  if (input.legalName.trim().length < 3) return "Enter your legal full name as shown on your KTP.";
  if (!input.consent) return "You must agree to the verification privacy consent.";
  for (const [label, file] of [["KTP photo", input.ktpImage], ["Selfie with KTP", input.selfieImage]] as const) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return `${label} must be a JPG, PNG, or WebP image.`;
    if (file.size > MAX_IMAGE_SIZE) return `${label} must be smaller than 8 MB.`;
  }
  return null;
}

function getExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function mapVerificationRow(row: VerificationRow): VerificationRequest {
  return {
    id: row.id,
    legalName: row.legal_name,
    ktpImagePath: row.ktp_image_path,
    selfieImagePath: row.selfie_image_path,
    status: row.status,
    rejectionReason: row.rejection_reason,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
  };
}
