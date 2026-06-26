"use client";

import { useRouter } from "next/navigation";
import { CreatePostScreen } from "@/app/components/CreatePostScreen";
import { useAppState } from "@/components/providers/AppStateProvider";

export default function CreatePage() {
  const router = useRouter();
  const { createPost, verificationStatus } = useAppState();

  return (
    <CreatePostScreen
      isVerified={verificationStatus === "approved"}
      onBack={() => router.push("/home")}
      onVerify={() => router.push("/verification")}
      onSubmit={async (input) => {
        const result = await createPost(input);
        if (!result.error) router.push("/home");
        return result;
      }}
    />
  );
}
