import type { ReactNode } from "react";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";

export default function UserAppLayout({ children }: { children: ReactNode }) {
  return (
    <MobileAppShell>
      <ProtectedLayout>{children}</ProtectedLayout>
    </MobileAppShell>
  );
}
