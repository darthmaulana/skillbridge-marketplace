"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReportScreen } from "@/app/components/ReportScreen";
import { useAppState } from "@/components/providers/AppStateProvider";
import type { PublicProfile } from "@/lib/auth";
import { submitSafetyReport } from "@/lib/safety";

export function ProfileReportClient({ profileId }: { profileId?: string | null }) {
  const router = useRouter();
  const { getPublicProfile, hideUser } = useAppState();
  const [target, setTarget] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    if (!profileId) {
      setTarget(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    getPublicProfile(profileId).then((profile) => {
      if (!active) return;
      setTarget(profile);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [getPublicProfile, profileId]);

  if (loading) return <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading user...</div>;
  if (!target) return <div className="grid h-full place-items-center text-sm text-muted-foreground">User not found.</div>;

  return (
    <ReportScreen
      onBack={() => router.replace(`/profile/view?id=${encodeURIComponent(target.id)}`)}
      targetName={target.full_name}
      reportedUserId={target.id}
      onSubmit={async (input) => {
        const result = await submitSafetyReport(input);
        if (!result.error && input.blockUser) hideUser(target.id);
        return result;
      }}
    />
  );
}
