import { redirect } from "next/navigation";

export default function LegacyTaskDetailRedirect() {
  redirect("/dashboard/tasks");
}
