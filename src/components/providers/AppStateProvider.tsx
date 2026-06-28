"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { INITIAL_POSTS, type VerificationStatus } from "@/app/data";
import type { Post } from "@/app/components/shared/PostCard";
import { env } from "@/lib/env";
import {
  DEMO_PROFILE,
  DEMO_PUBLIC_PROFILES,
  type AuthResult,
  type ProfileResult,
  type PublicProfile,
  type UpdateProfileInput,
  type UserProfile,
} from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { mapPostRows, type CreatePostInput, type CreatePostResult } from "@/lib/posts";
import { getDemoBlockedUserIds } from "@/lib/safety";

interface AppState {
  posts: Post[];
  addPost: (post: Post) => void;
  createPost: (input: CreatePostInput) => Promise<CreatePostResult>;
  postsLoading: boolean;
  postsError: string | null;
  reloadPosts: () => Promise<void>;
  verificationStatus: VerificationStatus;
  setVerificationStatus: (status: VerificationStatus) => void;
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  role: "user" | "admin";
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (fullName: string, email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updateProfile: (input: UpdateProfileInput) => Promise<ProfileResult>;
  getPublicProfile: (id: string) => Promise<PublicProfile | null>;
  hideUser: (userId: string) => void;
  signOut: () => Promise<void>;
  initialized: boolean;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const isDemoMode = !env.isSupabaseConfigured;
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatusState] = useState<VerificationStatus>("unverified");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(isDemoMode ? DEMO_PROFILE : null);
  const [demoAuthenticated, setDemoAuthenticated] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const isAuthenticated = isDemoMode ? demoAuthenticated : Boolean(user);
  const role = isDemoMode ? "admin" : profile?.role ?? "user";

  const loadProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setProfile(null);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
    if (data) {
      const typedProfile = data as UserProfile;
      setProfile(typedProfile);
      setVerificationStatusState(typedProfile.verification_status);
    }
  }, []);

  const reloadPosts = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setPostsError(null);
      return;
    }

    setPostsLoading(true);
    setPostsError(null);
    const postSelect = "id,user_id,post_type,title,description,category,budget_or_price,work_type,location,deadline,required_skills,portfolio_url,image_url,is_featured,created_at";
    const postResult = await supabase
      .from("public_posts")
      .select(postSelect)
      .order("created_at", { ascending: false });
    let postRows: Array<Record<string, unknown>> | null = postResult.data;
    let postError = postResult.error;

    if (postError && postError.message.toLowerCase().includes("is_featured")) {
      const fallback = await supabase
        .from("public_posts")
        .select("id,user_id,post_type,title,description,category,budget_or_price,work_type,location,deadline,required_skills,portfolio_url,image_url,created_at")
        .order("created_at", { ascending: false });
      postRows = fallback.data;
      postError = fallback.error;
    }

    if (postError) {
      setPostsError(postError.message);
      setPostsLoading(false);
      return;
    }

    const authorIds = [...new Set((postRows ?? []).map((post) => post.user_id))];
    const { data: authorRows, error: authorError } = authorIds.length
      ? await supabase.from("public_profiles").select("id,full_name,avatar_url,location,verification_status").in("id", authorIds)
      : { data: [], error: null };

    if (authorError) {
      setPostsError(authorError.message);
      setPostsLoading(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    setPosts(mapPostRows((postRows ?? []) as unknown as Parameters<typeof mapPostRows>[0], authorRows ?? [], sessionData.session?.user.id));
    setPostsLoading(false);
  }, []);

  useEffect(() => {
    const savedPosts = localStorage.getItem("skillbridge-posts");
    const savedStatus = localStorage.getItem("skillbridge-verification") as VerificationStatus | null;
    const savedAuth = localStorage.getItem("skillbridge-auth");

    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts) as Post[];
        const blockedIds = getDemoBlockedUserIds();
        setPosts(parsed.map((post) => ({
          ...post,
          userId: post.userId || INITIAL_POSTS.find((item) => item.id === post.id)?.userId || DEMO_PROFILE.id,
        })).filter((post) => !blockedIds.has(post.userId)));
      } catch {
        localStorage.removeItem("skillbridge-posts");
      }
    }
    const savedProfile = localStorage.getItem("skillbridge-profile");
    if (isDemoMode && savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile) as UserProfile;
        setProfile(parsedProfile);
        setVerificationStatusState(parsedProfile.verification_status);
      } catch {
        localStorage.removeItem("skillbridge-profile");
      }
    }
    if (savedStatus) setVerificationStatusState(savedStatus);
    if (savedAuth) setDemoAuthenticated(savedAuth === "true");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoaded(true);
      return;
    }

    supabase.auth.getSession()
      .then(async ({ data }) => {
        const authUser = data.session?.user ?? null;
        setUser(authUser);
        await loadProfile(authUser);
        setLoaded(true);
        void reloadPosts();
      })
      .catch(() => {
        setUser(null);
        setProfile(null);
        setLoaded(true);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      void loadProfile(authUser).finally(() => setLoaded(true));
      void reloadPosts();
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile, reloadPosts]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("skillbridge-posts", JSON.stringify(posts));
    localStorage.setItem("skillbridge-verification", verificationStatus);
    if (isDemoMode) {
      localStorage.setItem("skillbridge-auth", String(demoAuthenticated));
      if (profile) localStorage.setItem("skillbridge-profile", JSON.stringify(profile));
    }
  }, [demoAuthenticated, isDemoMode, loaded, posts, profile, verificationStatus]);

  useEffect(() => {
    if (!isDemoMode || !profile || profile.verification_status === verificationStatus) return;
    setProfile((current) => current ? {
      ...current,
      verification_status: verificationStatus,
      offline_job_access: verificationStatus === "approved",
    } : current);
  }, [isDemoMode, profile, verificationStatus]);

  const setVerificationStatus = useCallback((status: VerificationStatus) => {
    setVerificationStatusState(status);
    setProfile((current) => {
      const offlineJobAccess = status === "approved";
      if (!current || (current.verification_status === status && current.offline_job_access === offlineJobAccess)) return current;
      return {
        ...current,
        verification_status: status,
        offline_job_access: offlineJobAccess,
      };
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setDemoAuthenticated(true);
      setProfile((current) => current ?? DEMO_PROFILE);
      return { message: "Signed in using local demo mode." };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }, []);

  const signUp = useCallback(async (fullName: string, email: string, password: string): Promise<AuthResult> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setDemoAuthenticated(true);
      setProfile({ ...DEMO_PROFILE, full_name: fullName, email });
      return { message: "Account created using local demo mode." };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    return {
      requiresEmailConfirmation: !data.session,
      message: data.session ? undefined : "Check your email to confirm your account.",
    };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setDemoAuthenticated(true);
      setProfile((current) => current ?? DEMO_PROFILE);
      return { message: "Signed in using local demo mode." };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return error ? { error: error.message } : {};
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { message: "Demo mode does not send email. Use any credentials to sign in." };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return error ? { error: error.message } : { message: "Password reset email sent." };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    if (supabase) setProfile(null);
    setDemoAuthenticated(false);
  }, []);

  const updateProfile = useCallback(async (input: UpdateProfileInput): Promise<ProfileResult> => {
    if (!profile) return { error: "Your profile is not available yet." };
    if (input.fullName.trim().length < 2) return { error: "Full name must be at least 2 characters." };
    if (input.portfolioUrl && !/^https?:\/\//i.test(input.portfolioUrl)) {
      return { error: "Portfolio link must start with http:// or https://." };
    }
    const hasAnyPayoutInfo = Boolean(
      input.payoutMethod.trim()
      || input.payoutProvider.trim()
      || input.payoutAccountName.trim()
      || input.payoutAccountNumber.trim()
      || input.payoutNotes.trim(),
    );
    const hasRequiredPayoutInfo = Boolean(
      input.payoutMethod.trim()
      && input.payoutProvider.trim()
      && input.payoutAccountName.trim()
      && input.payoutAccountNumber.trim(),
    );
    if (hasAnyPayoutInfo && !hasRequiredPayoutInfo) {
      return { error: "Complete payout method, provider, account name, and account number before saving payout details." };
    }
    if (input.avatar && input.avatar.size > 3 * 1024 * 1024) {
      return { error: "Profile photo must be smaller than 3 MB." };
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      const avatarUrl = input.avatar ? await fileToDataUrl(input.avatar) : profile.avatar_url;
      const updatedProfile: UserProfile = {
        ...profile,
        full_name: input.fullName.trim(),
        avatar_url: avatarUrl,
        bio: input.bio.trim() || null,
        skills: input.skills,
        portfolio_url: input.portfolioUrl.trim() || null,
        location: input.location.trim() || null,
        payout_method: input.payoutMethod.trim() || null,
        payout_provider: input.payoutProvider.trim() || null,
        payout_account_name: input.payoutAccountName.trim() || null,
        payout_account_number: input.payoutAccountNumber.trim() || null,
        payout_notes: input.payoutNotes.trim() || null,
      };
      setProfile(updatedProfile);
      setPosts((current) => current.map((post) => post.userId === profile.id ? {
        ...post,
        userName: updatedProfile.full_name,
        avatar: updatedProfile.full_name.charAt(0).toUpperCase(),
        authorLocation: updatedProfile.location ?? undefined,
      } : post));
      return { profile: updatedProfile };
    }
    if (!user) return { error: "You must be signed in to edit your profile." };

    let avatarUrl = profile.avatar_url;
    if (input.avatar) {
      const extension = input.avatar.name.split(".").pop()?.toLowerCase() || "jpg";
      const avatarPath = `${user.id}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(avatarPath, input.avatar, {
        cacheControl: "3600",
        upsert: true,
      });
      if (uploadError) return { error: uploadError.message };
      avatarUrl = `${supabase.storage.from("avatars").getPublicUrl(avatarPath).data.publicUrl}?v=${Date.now()}`;
    }

    const updates = {
      full_name: input.fullName.trim(),
      avatar_url: avatarUrl,
      bio: input.bio.trim() || null,
      skills: input.skills,
      portfolio_url: input.portfolioUrl.trim() || null,
      location: input.location.trim() || null,
      payout_method: input.payoutMethod.trim() || null,
      payout_provider: input.payoutProvider.trim() || null,
      payout_account_name: input.payoutAccountName.trim() || null,
      payout_account_number: input.payoutAccountNumber.trim() || null,
      payout_notes: input.payoutNotes.trim() || null,
    };
    const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select("*").single();
    if (error) return { error: error.message };

    const updatedProfile = data as UserProfile;
    setProfile(updatedProfile);
    setPosts((current) => current.map((post) => post.userId === user.id ? {
      ...post,
      userName: updatedProfile.full_name,
      avatar: updatedProfile.full_name.charAt(0).toUpperCase(),
      authorLocation: updatedProfile.location ?? undefined,
    } : post));
    return { profile: updatedProfile };
  }, [profile, user]);

  const getPublicProfile = useCallback(async (id: string): Promise<PublicProfile | null> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      if (getDemoBlockedUserIds().has(id)) return null;
      if (profile?.id === id) return toPublicProfile(profile);
      return DEMO_PUBLIC_PROFILES[id] ?? null;
    }

    const { data, error } = await supabase
      .from("public_profiles")
      .select("id,full_name,avatar_url,bio,skills,portfolio_url,location,verification_status,created_at")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as PublicProfile;
  }, [profile]);

  const createPost = useCallback(async (input: CreatePostInput): Promise<CreatePostResult> => {
    const createdAt = new Date().toISOString();
    const postId = crypto.randomUUID();
    const authorName = profile?.full_name || user?.user_metadata.full_name || "Ayu Setiawati";
    const demoPost: Post = {
      id: postId,
      userId: profile?.id || user?.id || DEMO_PROFILE.id,
      type: input.type,
      mode: input.mode,
      title: input.title,
      description: input.description,
      budget: `${input.type === "skill" ? "From " : ""}Rp ${input.price.toLocaleString("id-ID")}`,
      category: input.category,
      location: input.mode === "online" ? input.location || "Remote" : input.location,
      userName: authorName,
      verified: verificationStatus === "approved",
      postedAt: "Just now",
      createdAt,
      avatar: authorName.charAt(0).toUpperCase(),
      owner: true,
      exactLocation: input.location || undefined,
      deadline: input.deadline,
      requiredSkills: input.requiredSkills,
      portfolioUrl: input.portfolioUrl,
      featured: false,
    };

    if (input.mode === "offline" && (profile?.verification_status !== "approved" || !profile.offline_job_access)) {
      return { error: "Complete identity verification before publishing offline posts." };
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setPosts((current) => [demoPost, ...current]);
      return { post: demoPost };
    }
    if (!user) return { error: "You must be signed in to publish a post." };

    let imageUrl: string | null = null;
    if (input.image) {
      const extension = input.image.name.split(".").pop()?.toLowerCase() || "jpg";
      const imagePath = `${user.id}/${postId}/cover.${extension}`;
      const { error: uploadError } = await supabase.storage.from("post-images").upload(imagePath, input.image, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) return { error: uploadError.message };
      imageUrl = supabase.storage.from("post-images").getPublicUrl(imagePath).data.publicUrl;
    }

    const { error } = await supabase.from("posts").insert({
      id: postId,
      user_id: user.id,
      post_type: input.type,
      title: input.title,
      description: input.description,
      category: input.category,
      budget_or_price: input.price,
      work_type: input.mode,
      location: input.mode === "online" ? input.location || null : input.location,
      deadline: input.type === "job" && input.deadline ? input.deadline : null,
      required_skills: input.type === "job" ? input.requiredSkills : [],
      portfolio_url: input.type === "skill" ? input.portfolioUrl || null : null,
      image_url: imageUrl,
    });

    if (error) return { error: error.message };
    const createdPost = { ...demoPost, imageUrl: imageUrl ?? undefined };
    setPosts((current) => [createdPost, ...current]);
    return { post: createdPost };
  }, [profile, user, verificationStatus]);

  const hideUser = useCallback((userId: string) => {
    setPosts((current) => current.filter((post) => post.userId !== userId));
  }, []);

  const value = useMemo<AppState>(() => ({
    posts,
    addPost: (post) => setPosts((current) => [post, ...current]),
    createPost,
    postsLoading,
    postsError,
    reloadPosts,
    verificationStatus,
    setVerificationStatus,
    user,
    profile,
    isAuthenticated,
    role,
    isDemoMode,
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    updateProfile,
    getPublicProfile,
    hideUser,
    signOut,
    initialized: loaded,
  }), [createPost, getPublicProfile, hideUser, isAuthenticated, isDemoMode, loaded, posts, postsError, postsLoading, profile, reloadPosts, resetPassword, role, signIn, signInWithGoogle, signOut, signUp, updateProfile, user, verificationStatus]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

function toPublicProfile(profile: UserProfile): PublicProfile {
  return {
    id: profile.id,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    skills: profile.skills,
    portfolio_url: profile.portfolio_url,
    location: profile.location,
    verification_status: profile.verification_status,
    created_at: profile.created_at,
  };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected profile photo."));
    reader.readAsDataURL(file);
  });
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used inside AppStateProvider");
  return value;
}

