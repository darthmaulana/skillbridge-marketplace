import { Suspense } from "react";
import { QueryProfileReportPage } from "./QueryProfileReportPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted-foreground">Loading report...</div>}>
      <QueryProfileReportPage />
    </Suspense>
  );
}
