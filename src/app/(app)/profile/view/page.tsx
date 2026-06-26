import { Suspense } from "react";
import { QueryProfilePage } from "./QueryProfilePage";

export default function Page() {
  return (
    <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted-foreground">Loading profile...</div>}>
      <QueryProfilePage />
    </Suspense>
  );
}
