"use client";

import { useRouter } from "next/navigation";
import { EditProfileScreen } from "@/app/components/EditProfileScreen";
import { useAppState } from "@/components/providers/AppStateProvider";

export default function EditProfilePage() {
  const router = useRouter();
  const { profile, updateProfile } = useAppState();

  if (!profile) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading profile...</div>;
  }

  return (
    <EditProfileScreen
      profile={profile}
      onBack={() => router.back()}
      onSubmit={async (input) => {
        const result = await updateProfile(input);
        if (!result.error) router.replace("/profile");
        return result;
      }}
    />
  );
}
