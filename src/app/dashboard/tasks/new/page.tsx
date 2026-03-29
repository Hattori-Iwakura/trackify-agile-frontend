import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default function CreateIssueRedirectPage({ searchParams }: PageProps) {
  const raw = searchParams.projectId;
  const projectId = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  const q = new URLSearchParams();
  q.set("create", "1");
  if (projectId) q.set("projectId", projectId);
  redirect(`/dashboard/tasks?${q.toString()}`);
}
