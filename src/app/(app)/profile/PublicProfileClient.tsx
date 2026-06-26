"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileScreen } from "@/app/components/ProfileScreen";
import { useAppState } from "@/components/providers/AppStateProvider";
import type { PublicProfile } from "@/lib/auth";

export function PublicProfileClient({ profileId }: { profileId?: string | null }) {
  const router = useRouter();
  const { posts, getPublicProfile } = useAppState();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    if (!profileId) {
      setProfile(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    getPublicProfile(profileId).then((result) => {
      if (!active) return;
      setProfile(result);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [getPublicProfile, profileId]);

  if (loading) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <div>
          <h1 className="font-bold">Profile not found</h1>
          <button className="mt-4 text-sm text-primary" onClick={() => router.back()}>Go back</button>
        </div>
      </div>
    );
  }

  return (
    <ProfileScreen
      profile={profile}
      posts={posts}
      onBack={() => router.back()}
      onReport={() => router.push(`/profile/report?id=${encodeURIComponent(profile.id)}`)}
      onPostClick={(post) => router.push(`/posts?id=${encodeURIComponent(post.id)}`)}
    />
  );
}
