
import ClientPage from "./ClientPage";

export function generateStaticParams() {
  return [{ id: "demo-chat-rizky" }, { id: "demo-chat-budi" }, { id: "demo-chat-farhan" }];
}

export default function Page() {
  return <ClientPage />;
}