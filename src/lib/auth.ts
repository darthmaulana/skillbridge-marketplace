export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  portfolio_url: string | null;
  location: string | null;
  role: "user" | "admin";
  is_banned: boolean;
  ban_reason: string | null;
  verification_status: "unverified" | "pending" | "approved" | "rejected";
  offline_job_access: boolean;
  created_at: string;
}

export interface PublicProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  portfolio_url: string | null;
  location: string | null;
  verification_status: "unverified" | "pending" | "approved" | "rejected";
  created_at: string;
}

export interface UpdateProfileInput {
  fullName: string;
  bio: string;
  skills: string[];
  portfolioUrl: string;
  location: string;
  avatar?: File;
}

export interface ProfileResult {
  profile?: UserProfile;
  error?: string;
}

export interface AuthResult {
  error?: string;
  message?: string;
  requiresEmailConfirmation?: boolean;
}

export const DEMO_PROFILE: UserProfile = {
  id: "demo-ayu",
  full_name: "Ayu Setiawati",
  email: "ayu@example.com",
  avatar_url: null,
  bio: "Creative graphic designer focused on brand identity, UI design, and illustration. Available for freelance projects.",
  skills: ["Figma", "Illustrator", "Branding", "UI Design", "Typography"],
  portfolio_url: "https://example.com/ayu-designs",
  location: "Bandung, Indonesia",
  role: "admin",
  is_banned: false,
  ban_reason: null,
  verification_status: "unverified",
  offline_job_access: false,
  created_at: "2026-01-15T08:00:00Z",
};

export const DEMO_PUBLIC_PROFILES: Record<string, PublicProfile> = {
  "demo-rizky": {
    id: "demo-rizky",
    full_name: "Rizky Pratama",
    avatar_url: null,
    bio: "Home maintenance specialist available for repair and improvement work.",
    skills: ["Home repair", "Project coordination"],
    portfolio_url: null,
    location: "Bandung",
    verification_status: "approved",
    created_at: "2025-10-10T08:00:00Z",
  },
  "demo-farhan": {
    id: "demo-farhan",
    full_name: "Farhan Maulana",
    avatar_url: null,
    bio: "Technology writer and English to Indonesian translator.",
    skills: ["Translation", "Writing", "Editing"],
    portfolio_url: null,
    location: null,
    verification_status: "unverified",
    created_at: "2026-02-01T08:00:00Z",
  },
  "demo-dewi": {
    id: "demo-dewi",
    full_name: "Dewi Kusuma",
    avatar_url: null,
    bio: "Private mathematics tutor for high school students.",
    skills: ["Mathematics", "Tutoring", "Exam preparation"],
    portfolio_url: "https://example.com/dewi-tutoring",
    location: "Jakarta Selatan",
    verification_status: "approved",
    created_at: "2025-08-20T08:00:00Z",
  },
  "demo-budi": {
    id: "demo-budi",
    full_name: "Budi Santoso",
    avatar_url: null,
    bio: "Building digital products with small teams.",
    skills: ["Product planning", "React"],
    portfolio_url: null,
    location: null,
    verification_status: "unverified",
    created_at: "2026-03-12T08:00:00Z",
  },
  "demo-sari": {
    id: "demo-sari",
    full_name: "Sari Cleaning",
    avatar_url: null,
    bio: "Professional home and apartment cleaning service.",
    skills: ["Deep cleaning", "Home care"],
    portfolio_url: null,
    location: "Surabaya",
    verification_status: "approved",
    created_at: "2025-11-04T08:00:00Z",
  },
};
