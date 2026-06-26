import { DEMO_PROFILE, DEMO_PUBLIC_PROFILES } from "@/lib/auth";
import ClientPage from "./ClientPage";

export function generateStaticParams() {
  return [DEMO_PROFILE.id, ...Object.keys(DEMO_PUBLIC_PROFILES)].map((id) => ({ id }));
}

export default function Page() {
  return <ClientPage />;
}