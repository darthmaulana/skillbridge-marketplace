"use client";

import { useRouter } from "next/navigation";
import { PostDetailScreen } from "@/app/components/PostDetailScreen";
import { useAppState } from "@/components/providers/AppStateProvider";
import { openChatForPost } from "@/lib/chat";
import { createPaymentCheckout } from "@/lib/paymentClient";

export function PostDetailClient({ postId }: { postId?: string | null }) {
  const router = useRouter();
  const { posts, postsLoading, verificationStatus, profile } = useAppState();
  const post = posts.find((item) => item.id === postId);

  if (postsLoading) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading post...</div>;
  }

  if (!post) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <div>
          <h1 className="font-bold">Post not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This post may still be loading, deleted, or unavailable.</p>
          <button className="mt-4 text-sm text-primary" onClick={() => router.replace("/home")}>Return home</button>
        </div>
      </div>
    );
  }

  return (
    <PostDetailScreen
      post={post}
      isViewerVerified={verificationStatus === "approved"}
      onBack={() => router.back()}
      onChat={async () => {
        if (!profile) return "Your profile is still loading.";
        const result = await openChatForPost(post, profile);
        if (result.data) router.push(`/chat/${result.data}`);
        return result.error;
      }}
      onReport={() => router.push(`/posts/report?id=${encodeURIComponent(post.id)}`)}
      onVerify={() => router.push("/verification")}
      onProfile={() => router.push(`/profile/view?id=${encodeURIComponent(post.userId)}`)}
      onPay={async () => {
        const result = await createPaymentCheckout(post.id);
        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
          return;
        }
        return result.error;
      }}
    />
  );
}
