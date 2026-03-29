"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ProjectSettingsPanel } from "@/components/projects/ProjectSettingsPanel";

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = String(params.projectId ?? "");

  const [projectTitle, setProjectTitle] = React.useState("");

  const onProjectLoaded = React.useCallback(({ name }: { name: string }) => {
    setProjectTitle(name);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="max-w-4xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link href="/dashboard/projects" className="text-sm text-muted-foreground hover:text-foreground">
            ← Projects
          </Link>
          <Link href={`/dashboard/projects/${projectId}/board`} className="ml-4 text-sm text-primary hover:underline">
            Board
          </Link>
          <Link href={`/dashboard/projects/${projectId}/backlog`} className="ml-4 text-sm text-primary hover:underline">
            Backlog
          </Link>
        </div>
      </div>

      <h1 className="mb-6 text-2xl font-semibold text-foreground">Cài đặt: {projectTitle}</h1>

      <ProjectSettingsPanel projectId={projectId} variant="page" onProjectLoaded={onProjectLoaded} />
    </motion.div>
  );
}
