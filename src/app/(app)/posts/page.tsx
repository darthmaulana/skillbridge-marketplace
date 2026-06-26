import { Suspense } from "react";
import { QueryPostPage } from "./QueryPostPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted-foreground">Loading post...</div>}>
      <QueryPostPage />
    </Suspense>
  );
}
