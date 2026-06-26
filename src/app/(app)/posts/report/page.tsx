import { Suspense } from "react";
import { QueryPostReportPage } from "./QueryPostReportPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted-foreground">Loading report...</div>}>
      <QueryPostReportPage />
    </Suspense>
  );
}
