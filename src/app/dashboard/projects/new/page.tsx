export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default function CreateProjectRedirectPage() {
  redirect("/dashboard/projects?create=1");
}
