import { INITIAL_POSTS } from "@/app/data";
import ClientPage from "./ClientPage";

export function generateStaticParams() {
  return INITIAL_POSTS.map((post) => ({ id: post.id }));
}

export default function Page() {
  return <ClientPage />;
}