"use client";

import { useState, useCallback, useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { displayInitials, getUserProfile, setUserProfile } from "@/lib/auth-profile";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  STORAGE_EMAIL_NOTIFICATIONS,
  readDarkModePreference,
  persistDarkMode,
} from "@/lib/theme-preferences";
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

export default function ProfilePage() {
  const [emailNotif, setEmailNotif] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
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
    try {
      setDarkMode(readDarkModePreference());
      setEmailNotif(localStorage.getItem(STORAGE_EMAIL_NOTIFICATIONS) === "true");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
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
        if (cancelled) return;
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
            if (!cancelled) setStats(dash);
          } catch {
            if (!cancelled) {
              setStats(emptyDashboardStats());
              setStatsNote("Không tải được thống kê (kiểm tra dự án hoặc mạng).");
            }
          }
        } else {
          setStats(emptyDashboardStats());
          setStatsNote("Đặt NEXT_PUBLIC_API_URL trỏ Nest (vd: http://localhost:4000/api) để xem số liệu thật.");
        }
      } catch {
        if (!cancelled) {
          if (!local) {
            setProfileError("Không tải được hồ sơ từ server. Thử đăng nhập lại.");
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reset]);

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
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] },
    maxFiles: 1,
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
                  icon={<MailGlyph className="w-5 h-5" />}
                  text={emailWatch?.trim() || "—"}
                  onEdit={() => setIsEditingInfo(true)}
                />
              </ul>

              {isEditingInfo ? (
                <div className="border-t border-black/80 pt-5 mt-auto">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                    Chỉnh sửa
                    <PencilIcon className="w-3.5 h-3.5" />
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
                    Save
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
                <GearIcon className="w-5 h-5 text-muted-foreground shrink-0" />
                <CardTitle className="text-base sm:text-lg">Settings</CardTitle>
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
                    checked={darkMode}
                    onCheckedChange={(v) => {
                      setDarkMode(v);
                      persistDarkMode(v);
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
          aria-label="Edit"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
      )}
    </li>
  );
}

function MailGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.12l-2.83.904.905-2.83a4.5 4.5 0 011.12-1.89l12.725-12.725z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.862 4.487" />
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
