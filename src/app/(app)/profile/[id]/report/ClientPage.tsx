"use client";

import { useParams } from "next/navigation";
import { ProfileReportClient } from "../../ProfileReportClient";

export default function ClientPage() {
  const params = useParams<{ id: string }>();
  return <ProfileReportClient profileId={params.id} />;
}
