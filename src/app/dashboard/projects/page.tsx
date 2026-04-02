"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowRight, FolderKanban, Plus } from "lucide-react";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage } from "@/lib/api";
import { fetchProjectsPage } from "@/lib/projects-issues-api";
import type { ProjectSummary } from "@/lib/types/issues";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";

const BOARD_BACKGROUNDS = [
  "from-zinc-900 via-zinc-900 to-black",
  "from-neutral-900 via-neutral-900 to-black",
  "from-stone-900 via-zinc-900 to-black",
  "from-zinc-800 via-zinc-900 to-black",
  "from-neutral-800 via-neutral-900 to-black",
  "from-black via-zinc-900 to-zinc-950",
];

function ProjectsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createFromUrl = searchParams.get("create") === "1";
  const [createOpenExtra, setCreateOpenExtra] = React.useState(false);
  const createModalOpen = createFromUrl || createOpenExtra;

  const handleCreateModalOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        setCreateOpenExtra(false);
        if (searchParams.get("create") === "1") {
          router.replace("/dashboard/projects", { scroll: false });
        }
      }
    },
    [router, searchParams],
  );

  const [projects, setProjects] = React.useState<ProjectSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const reloadProjects = React.useCallback(async () => {
    if (!isNestBackendConfigured()) return;
    try {
      const paginated = await fetchProjectsPage(1, 100);
      setProjects(paginated.data);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    if (!isNestBackendConfigured()) {
      setLoading(false);
      setError("Đặt NEXT_PUBLIC_API_URL trỏ Nest (vd: http://localhost:4000/api) để tải danh sách project.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const paginated = await fetchProjectsPage(1, 100);
        if (cancelled) return;
        setProjects(paginated.data);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e, "Không tải được danh sách project."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* Dialog portal tách khỏi motion để tránh lỗi DOM insertBefore (React + Framer Motion). */}
      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={(open) => {
          if (!open) handleCreateModalOpenChange(false);
        }}
        onCreated={() => void reloadProjects()}
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="space-y-5"
      >
      <Card className="border-border/60 bg-gradient-to-r from-card via-card to-muted/30">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground">
              <FolderKanban className="h-3.5 w-3.5" />
              Workspace Projects
            </div>
            <CardTitle className="text-2xl">Danh sách project</CardTitle>
          </div>
          <Button type="button" className="gap-2" onClick={() => setCreateOpenExtra(true)}>
            <Plus className="h-4 w-4" />
            Tạo project
          </Button>
        </CardHeader>
      </Card>

      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Đang tải danh sách project...</CardContent>
        </Card>
      ) : projects.length === 0 && !error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center text-sm text-muted-foreground">
            <p>Chưa có project. Tạo project mới để bắt đầu.</p>
            <Button type="button" className="gap-2" onClick={() => setCreateOpenExtra(true)}>
              <Plus className="h-4 w-4" />
              Tạo project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your boards</h2>
            <span className="text-xs text-muted-foreground">{projects.length} projects</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, index) => (
              <div key={project.id} className="group relative">
                <Link href={`/dashboard/projects/${project.id}/board`} className="block">
                  <div
                    className={`relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br ${BOARD_BACKGROUNDS[index % BOARD_BACKGROUNDS.length]} p-4 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl`}
                  >
                    <div className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/45" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_45%)]" />

                    <div className="relative flex h-full flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-lg font-semibold drop-shadow-sm">{project.name}</h3>
                        <Badge variant="secondary" className="border-white/40 bg-white/20 font-mono text-white">
                          {project.key}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <p className="line-clamp-2 text-xs text-white/90">
                          {project.description ?? "Chưa có mô tả cho project này."}
                        </p>
                        <div className="inline-flex items-center gap-1 text-xs font-medium text-white/95">
                          Open board
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
      </motion.div>
    </>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Đang tải…</CardContent>
        </Card>
      }
    >
      <ProjectsPageInner />
    </Suspense>
  );
}
