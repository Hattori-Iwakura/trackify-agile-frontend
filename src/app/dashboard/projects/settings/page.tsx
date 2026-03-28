import { redirect } from "next/navigation";

export default function LegacyProjectSettingsRedirect() {
  redirect("/dashboard/projects");
}
