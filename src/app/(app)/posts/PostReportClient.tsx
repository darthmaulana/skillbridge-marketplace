"use client";

import { useRouter } from "next/navigation";
import { ReportScreen } from "@/app/components/ReportScreen";
import { useAppState } from "@/components/providers/AppStateProvider";
import { submitSafetyReport } from "@/lib/safety";

export function PostReportClient({ postId }: { postId?: string | null }) {
  const router = useRouter();
  const { posts, hideUser } = useAppState();
  const post = posts.find((item) => item.id === postId);

  if (!post) return <div className="grid h-full place-items-center text-sm text-muted-foreground">Post not found.</div>;

  return (
    <ReportScreen
      onBack={() => router.replace(`/posts?id=${encodeURIComponent(post.id)}`)}
      targetName={post.title}
      postId={post.id}
      reportedUserId={post.userId}
      onSubmit={async (input) => {
        const result = await submitSafetyReport(input);
        if (!result.error && input.blockUser) hideUser(post.userId);
        return result;
      }}
    />
  );
}
