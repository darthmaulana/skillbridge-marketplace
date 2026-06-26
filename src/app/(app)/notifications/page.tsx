"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationsScreen, type NotificationItem } from "@/app/components/NotificationsScreen";
import { useAppState } from "@/components/providers/AppStateProvider";
import { env } from "@/lib/env";

export default function NotificationsPage() {
  const router = useRouter();
  const { posts, profile, role, verificationStatus } = useAppState();
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());

  const notifications = useMemo<NotificationItem[]>(() => {
    const latestPost = posts.find((post) => !post.owner);
    const isAllowedAdmin = Boolean(
      profile?.email &&
        role === "admin" &&
        !profile.is_banned &&
        env.adminEmails.includes(profile.email.toLowerCase()),
    );
    const items: NotificationItem[] = [];

    if (verificationStatus === "pending") {
      items.push({
        id: "verification-pending",
        type: "verification",
        title: "KTP verification is under review",
        description: "Your documents are waiting for manual admin review. We will update you when the decision is ready.",
        time: "Just now",
        unread: true,
        actionLabel: "View",
        onAction: () => router.push("/verification"),
      });
    } else if (verificationStatus === "approved") {
      items.push({
        id: "verification-approved",
        type: "verification",
        title: "Offline jobs unlocked",
        description: "Your account is verified for offline work. You can now create and contact offline posts safely.",
        time: "Today",
        unread: true,
        actionLabel: "Create",
        onAction: () => router.push("/create"),
      });
    } else if (verificationStatus === "rejected") {
      items.push({
        id: "verification-rejected",
        type: "verification",
        title: "Verification needs attention",
        description: "Your last submission was rejected. Check the reason and submit clearer KTP photos.",
        time: "Today",
        unread: true,
        actionLabel: "Fix",
        onAction: () => router.push("/verification"),
      });
    } else {
      items.push({
        id: "verification-start",
        type: "verification",
        title: "Verify to unlock offline jobs",
        description: "Submit KTP verification to create offline posts and contact verified users for in-person work.",
        time: "Today",
        unread: true,
        actionLabel: "Verify",
        onAction: () => router.push("/verification"),
      });
    }

    if (latestPost) {
      items.push({
        id: `post-${latestPost.id}`,
        type: "post",
        title: `New ${latestPost.type === "job" ? "job" : "skill"} in ${latestPost.category}`,
        description: `${latestPost.title} by ${latestPost.userName}`,
        time: latestPost.postedAt,
        unread: latestPost.mode === "offline",
        actionLabel: "Open",
        onAction: () => router.push(`/posts?id=${encodeURIComponent(latestPost.id)}`),
      });
    }

    items.push({
      id: "message-reminder",
      type: "message",
      title: "Keep conversations inside SkillBridge",
      description: "Use chat for project details so blocked users and safety rules continue to protect you.",
      time: "Today",
      unread: false,
      actionLabel: "Chats",
      onAction: () => router.push("/chat"),
    });

    items.push({
      id: "safety-offline",
      type: "safety",
      title: "Offline work safety reminder",
      description: "Meet in a public place first and avoid sharing precise home addresses before trust is established.",
      time: "This week",
      unread: false,
    });

    if (isAllowedAdmin) {
      items.push({
        id: "admin-review",
        type: "safety",
        title: "Admin items may need review",
        description: "Check verification requests and reports from the admin dashboard.",
        time: "Today",
        unread: true,
        actionLabel: "Admin",
        onAction: () => router.push("/admin"),
      });
    }

    if (profile?.is_banned) {
      items.unshift({
        id: "account-restricted",
        type: "safety",
        title: "Account restricted",
        description: profile.ban_reason || "This account has been restricted by an administrator.",
        time: "Now",
        unread: true,
      });
    }

    return items.map((item) => ({ ...item, unread: item.unread && !readIds.has(item.id) }));
  }, [posts, profile, readIds, role, router, verificationStatus]);

  return (
    <NotificationsScreen
      notifications={notifications}
      onBack={() => router.push("/home")}
      onMarkAllRead={() => setReadIds(new Set(notifications.map((item) => item.id)))}
    />
  );
}
