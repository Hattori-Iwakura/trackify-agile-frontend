import { redirect } from "next/navigation";

export default function LegacyTaskBoardRedirect() {
  redirect("/dashboard/projects");
}
