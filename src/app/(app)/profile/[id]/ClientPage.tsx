"use client";

import { useParams } from "next/navigation";
import { PublicProfileClient } from "../PublicProfileClient";

export default function ClientPage() {
  const params = useParams<{ id: string }>();
  return <PublicProfileClient profileId={params.id} />;
}
