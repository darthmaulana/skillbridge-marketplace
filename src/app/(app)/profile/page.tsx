"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileScreen } from "@/app/components/ProfileScreen";
import { useAppState } from "@/components/providers/AppStateProvider";
import type { PublicProfile } from "@/lib/auth";
import { loadEarningsSummary, type EarningsSummary } from "@/lib/earnings";

export default function ProfilePage() {
  const router = useRouter();
  const { posts, profile, signOut } = useAppState();
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    loadEarningsSummary(profile.id).then((result) => {
      if (!active || result.error) return;
      setEarnings(result.data ?? null);
    });
    return () => {
      active = false;
    };
  }, [profile]);

  if (!profile) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading profile...</div>;
  }

  const publicProfile: PublicProfile = {
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

  return (
    <ProfileScreen
      profile={publicProfile}
      privateProfile={profile}
      earnings={earnings}
      posts={posts}
      isOwnProfile
      onEdit={() => router.push("/profile/edit")}
      onVerify={() => router.push("/verification")}
      onAbout={() => router.push("/about")}
      onTerms={() => router.push("/terms")}
      onPayoutSettings={() => router.push("/profile/payout")}
      onPostClick={(post) => router.push(`/posts?id=${encodeURIComponent(post.id)}`)}
      onLogout={async () => {
        await signOut();
        router.replace("/login");
      }}
    />
  );
}
