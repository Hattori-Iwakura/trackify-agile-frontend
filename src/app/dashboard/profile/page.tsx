"use client";

import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Pencil, Settings } from "lucide-react";
import { toast } from "sonner";
import { displayInitials, getUserProfile, setUserProfile } from "@/lib/auth-profile";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { STORAGE_EMAIL_NOTIFICATIONS } from "@/lib/theme-preferences";
import { ProfileActivityChart } from "@/components/dashboard/ProfileActivityChart";
import {
  aggregateMyDashboard,
  emptyDashboardStats,
  isNestBackendConfigured,
  type MyDashboardStats,
} from "@/lib/aggregate-my-dashboard";
import { resolvePublicFileUrl } from "@/lib/api-origin";
import { fetchMe, getApiErrorMessage, updateMyProfile, uploadMyAvatar } from "@/lib/api";
import { updateProfileSchema, type UpdateProfileInput } from "@/validations/profile";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export default function ProfilePage() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const loadGenRef = useRef(0);
  const [emailNotif, setEmailNotif] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("User");
  const [avatarPublicUrl, setAvatarPublicUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<MyDashboardStats>(() => emptyDashboardStats());
  const [statsNote, setStatsNote] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { fullName: "", email: "" },
  });
  const fullNameWatch = watch("fullName");
  const emailWatch = watch("email");
  const titleName = fullNameWatch?.trim() ? fullNameWatch.trim() : displayName;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      setEmailNotif(localStorage.getItem(STORAGE_EMAIL_NOTIFICATIONS) === "true");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const gen = ++loadGenRef.current;
    let cancelled = false;
    (async () => {
      const local = getUserProfile();
      if (local) {
        setDisplayName(local.fullName);
        const av = resolvePublicFileUrl(local.avatarUrl ?? null);
        if (av) setAvatarPublicUrl(av);
      }
      try {
        const me = await fetchMe();
        if (cancelled || gen !== loadGenRef.current) return;
        setProfileError(null);
        setDisplayName(me.fullName);
        setAvatarPublicUrl(resolvePublicFileUrl(me.avatarUrl ?? null));
        reset({ fullName: me.fullName, email: me.email });
        setUserProfile({
          fullName: me.fullName,
          email: me.email,
          avatarUrl: me.avatarUrl ?? undefined,
        });

        if (isNestBackendConfigured()) {
          setStatsNote(null);
          try {
            const dash = await aggregateMyDashboard(me.id);
            if (cancelled || gen !== loadGenRef.current) return;
            setStats(dash);
          } catch {
            if (cancelled || gen !== loadGenRef.current) return;
            setStats(emptyDashboardStats());
            setStatsNote("Không tải được thống kê (kiểm tra dự án hoặc mạng).");
          }
        } else {
          setStats(emptyDashboardStats());
          setStatsNote("Đặt NEXT_PUBLIC_API_URL trỏ Nest (vd: http://localhost:4000/api) để xem số liệu thật.");
        }
      } catch {
        if (cancelled || gen !== loadGenRef.current) return;
        if (!local) {
          setProfileError("Không tải được hồ sơ từ server. Thử đăng nhập lại.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, reset]);

  const onDropAvatar = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps: getAvatarRootProps, getInputProps: getAvatarInputProps } = useDropzone({
    onDrop: onDropAvatar,
    onDropRejected: (rejections) => {
      const tooBig = rejections.some((r) => r.errors.some((e) => e.code === "file-too-large"));
      if (tooBig) {
        toast.error("Ảnh quá lớn (tối đa 5 MB).");
        setProfileError("Ảnh quá lớn (tối đa 5 MB).");
      }
    },
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] },
    maxFiles: 1,
    maxSize: MAX_AVATAR_BYTES,
    multiple: false,
  });

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    if (!isNestBackendConfigured()) {
      setProfileError("Cần NEXT_PUBLIC_API_URL trỏ Nest để tải avatar lên server.");
      return;
    }
    setUploading(true);
    setProfileError(null);
    try {
      const me = await uploadMyAvatar(avatarFile);
      setAvatarPublicUrl(resolvePublicFileUrl(me.avatarUrl ?? null));
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      setProfileError(getApiErrorMessage(err, "Tải avatar thất bại."));
    } finally {
      setUploading(false);
    }
  };

  const onSaveProfile = handleSubmit(async (data) => {
    if (!isNestBackendConfigured()) return;
    setProfileError(null);
    setSaveOk(false);
    try {
      const me = await updateMyProfile({
        fullName: data.fullName.trim(),
        email: data.email.trim(),
      });
      setDisplayName(me.fullName);
      setAvatarPublicUrl(resolvePublicFileUrl(me.avatarUrl ?? null));
      reset({ fullName: me.fullName, email: me.email });
      setSaveOk(true);
      setIsEditingInfo(false);
      window.setTimeout(() => setSaveOk(false), 4000);
    } catch (err) {
      setProfileError(getApiErrorMessage(err, "Không lưu được hồ sơ."));
    }
  });

  const statItems = [
    { label: "Tasks Done", value: stats.tasksDone },
    { label: "Bugs Fixed", value: stats.bugsFixed },
    { label: "Open (assigned)", value: stats.openAssigned },
  ];

  return (
    <div className="space-y-8 w-full pb-10">
      {profileError && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {profileError}
        </p>
      )}

      {/* Header — căng hàng với cạnh trái lưới bên dưới (Figma) */}
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex items-center gap-5 min-w-0">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="w-[88px] h-[88px] sm:w-24 sm:h-24 rounded-full object-cover border-2 border-black/80 shrink-0 shadow-sm"
            />
          ) : avatarPublicUrl ? (
            <img
              src={avatarPublicUrl}
              alt=""
              onError={() => setAvatarPublicUrl(null)}
              className="w-[88px] h-[88px] sm:w-24 sm:h-24 rounded-full object-cover border-2 border-black/80 shrink-0 shadow-sm"
            />
          ) : (
            <div className="w-[88px] h-[88px] sm:w-24 sm:h-24 rounded-full bg-secondary flex items-center justify-center text-2xl font-semibold text-foreground shrink-0 border-2 border-black/80 shadow-sm">
              {displayInitials(displayName)}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight truncate">
              {titleName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div
                {...getAvatarRootProps()}
                className="cursor-pointer text-sm text-primary hover:underline"
              >
                <input {...getAvatarInputProps()} />
                Chọn ảnh đại diện
              </div>
              {avatarFile && (
                <Button type="button" size="sm" onClick={() => void handleUploadAvatar()} disabled={uploading}>
                  {uploading ? "Đang tải..." : "Tải lên"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hàng 1: ~40% liên hệ + chỉnh sửa | ~60% tổng quan (một card, 3 ô con) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
        <motion.div
          className="lg:col-span-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Card className="h-full flex flex-col min-h-0">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Thông tin liên hệ</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 gap-5 pt-2 relative">
              <ul className="space-y-3.5">
                <ContactLine
                  icon={<Mail className="w-5 h-5" />}
                  text={emailWatch?.trim() || "—"}
                  onEdit={() => setIsEditingInfo(true)}
                />
              </ul>

              {isEditingInfo ? (
                <div className="border-t border-black/80 pt-5 mt-auto">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                    Chỉnh sửa
                    <Pencil className="w-3.5 h-3.5" />
                  </p>
                  <form className="space-y-4" onSubmit={onSaveProfile}>
                    <div className="space-y-2">
                      <Label htmlFor="profile-fullName">Họ tên</Label>
                      <Input
                        id="profile-fullName"
                        autoComplete="name"
                        disabled={!isNestBackendConfigured() || isSubmitting}
                        {...register("fullName")}
                      />
                      {errors.fullName?.message && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-email">Email</Label>
                      <Input
                        id="profile-email"
                        type="email"
                        autoComplete="email"
                        disabled={!isNestBackendConfigured() || isSubmitting}
                        {...register("email")}
                      />
                      {errors.email?.message && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                    {!isNestBackendConfigured() ? (
                      <p className="text-xs text-muted-foreground">
                        Đặt <code className="text-foreground">NEXT_PUBLIC_API_URL</code> trỏ Nest để lưu hồ sơ.
                      </p>
                    ) : null}
                    <div className="flex items-center gap-3 pt-2">
                      <Button type="submit" disabled={!isNestBackendConfigured() || isSubmitting} className="flex-1 sm:flex-none">
                        {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsEditingInfo(false)} disabled={isSubmitting}>
                        Hủy
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="mt-auto pt-4 flex justify-end">
                  {saveOk ? (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mr-auto self-center" role="status">
                      Đã lưu hồ sơ.
                    </p>
                  ) : null}
                  <Button type="button" variant="outline" className="rounded-full px-6" onClick={() => setIsEditingInfo(true)}>
                    Chỉnh sửa
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="lg:col-span-7"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05, ease: "easeOut" }}
        >
          <Card className="h-full flex flex-col min-h-[240px] lg:min-h-[280px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">Tổng quan</CardTitle>
              {statsNote ? (
                <p className="text-xs text-muted-foreground font-normal mt-1">{statsNote}</p>
              ) : null}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 min-h-[140px]">
                {statItems.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="h-full min-h-[120px]"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.06 + i * 0.04, ease: "easeOut" }}
                  >
                    <Card className="h-full bg-card border border-border shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-lg p-4 flex flex-col justify-center items-center text-center">
                      <p className="text-sm font-medium text-foreground mb-3">{stat.label}</p>
                      <p className="text-4xl sm:text-5xl font-light text-foreground tabular-nums tracking-tight">{stat.value}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Hàng 2: ~65% biểu đồ | ~35% settings — cạnh phải thẳng hàng với cột tổng quan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
        <motion.div
          className="lg:col-span-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
        >
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Hoạt động (14 ngày)</CardTitle>
              <p className="text-xs text-muted-foreground font-normal mt-1">
                Issue được gán bạn và có cập nhật theo ngày.
              </p>
            </CardHeader>
            <CardContent className="min-h-[260px]">
              <ProfileActivityChart data={stats.activityByDay} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="lg:col-span-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15, ease: "easeOut" }}
        >
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-muted-foreground shrink-0" />
                <CardTitle className="text-base sm:text-lg">Cài đặt</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-5 pt-1">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="settings-email-notif" className="text-sm font-medium text-foreground cursor-pointer">
                    Thông báo email
                  </Label>
                  <Switch
                    id="settings-email-notif"
                    checked={emailNotif}
                    onCheckedChange={(v) => {
                      setEmailNotif(v);
                      try {
                        localStorage.setItem(STORAGE_EMAIL_NOTIFICATIONS, v ? "true" : "false");
                      } catch {
                        /* ignore */
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="settings-dark-mode" className="text-sm font-medium text-foreground cursor-pointer">
                    Chế độ tối
                  </Label>
                  <Switch
                    id="settings-dark-mode"
                    checked={mounted ? resolvedTheme === "dark" : false}
                    onCheckedChange={(v) => {
                      setTheme(v ? "dark" : "light");
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function ContactLine({
  icon,
  text,
  muted,
  onEdit,
}: {
  icon: ReactNode;
  text: string;
  muted?: boolean;
  onEdit?: () => void;
}) {
  return (
    <li className="flex items-start gap-3 group">
      <span className="text-muted-foreground shrink-0 mt-0.5">{icon}</span>
      <span
        className={`text-sm break-all leading-snug flex-1 ${muted ? "text-muted-foreground italic" : "text-foreground"}`}
      >
        {text}
      </span>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground p-1 rounded-md hover:bg-muted"
          aria-label="Chỉnh sửa"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}
    </li>
  );
}
