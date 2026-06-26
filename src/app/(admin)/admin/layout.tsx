import type { ReactNode } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { MobileAppShell } from "@/components/layout/MobileAppShell";

export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  return (
    <MobileAppShell admin>
      <AdminLayout>{children}</AdminLayout>
    </MobileAppShell>
  );
}
