"use client";

import { useRouter } from "next/navigation";
import { PayoutSettingsScreen } from "@/app/components/PayoutSettingsScreen";
import { useAppState } from "@/components/providers/AppStateProvider";

export default function PayoutSettingsPage() {
  const router = useRouter();
  const { profile, updateProfile } = useAppState();

  if (!profile) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading payout account...</div>;
  }

  return (
    <PayoutSettingsScreen
      profile={profile}
      onBack={() => router.push("/profile")}
      onSubmit={(input) => updateProfile({
        fullName: profile.full_name,
        bio: profile.bio ?? "",
        skills: profile.skills,
        portfolioUrl: profile.portfolio_url ?? "",
        location: profile.location ?? "",
        payoutMethod: input.payoutMethod,
        payoutProvider: input.payoutProvider,
        payoutAccountName: input.payoutAccountName,
        payoutAccountNumber: input.payoutAccountNumber,
        payoutNotes: input.payoutNotes,
      })}
    />
  );
}
