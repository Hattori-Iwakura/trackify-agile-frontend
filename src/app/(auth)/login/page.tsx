"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { loginSchema, type LoginInput } from "@/validations/auth";
import { getApiErrorMessage, loginAndStoreTokens } from "@/lib/api";
import { AuthEmailOutlineIcon, AuthFacebookIcon, AuthGoogleIcon } from "@/components/auth/auth-page-icons";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export default function LoginPage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    setSubmitError(null);
    const email = data.email.trim().toLowerCase();
    try {
      await loginAndStoreTokens(email, data.password);
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err, "Email hoặc mật khẩu không đúng."));
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <motion.div
        className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 lg:px-12 bg-background"
        initial="initial"
        animate="animate"
        variants={stagger}
      >
        <div className="w-full max-w-md flex flex-col gap-6">
          <motion.h1 className="text-3xl font-bold tracking-tight text-foreground" variants={fadeInUp}>
            Đăng nhập tài khoản
          </motion.h1>

          <div className="flex flex-col gap-3">
            <motion.div variants={fadeInUp}>
              <Button variant="outline" className="w-full h-12 rounded-xl gap-2 border-border/50 bg-transparent hover:bg-muted/50" type="button">
                <AuthEmailOutlineIcon className="w-5 h-5" />
                <span className="font-medium">Tiếp tục với Email</span>
              </Button>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <Button variant="outline" className="w-full h-12 rounded-xl gap-2 border-border/50 bg-transparent hover:bg-muted/50" type="button">
                <AuthGoogleIcon className="w-5 h-5" />
                <span className="font-medium">Tiếp tục với Google</span>
              </Button>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <Button variant="outline" className="w-full h-12 rounded-xl gap-2 border-border/50 bg-transparent hover:bg-muted/50" type="button">
                <AuthFacebookIcon className="w-5 h-5" />
                <span className="font-medium">Tiếp tục với Facebook</span>
              </Button>
            </motion.div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2 w-full">
            <motion.div variants={fadeInUp} className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="admin@root.vn"
                className={cn("h-12 rounded-xl bg-muted border-0", errors.email && "ring-2 ring-destructive/50")}
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email?.message ? (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              ) : null}
            </motion.div>
            <motion.div variants={fadeInUp} className="space-y-2">
              <Label htmlFor="login-password" className="text-sm font-medium">Mật khẩu</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                className={cn("h-12 rounded-xl bg-muted border-0", errors.password && "ring-2 ring-destructive/50")}
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password?.message ? (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              ) : null}
            </motion.div>
            {submitError && (
              <p className="text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}
            <motion.div variants={fadeInUp} className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#0f172a] text-white hover:bg-[#1e293b]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </motion.div>
          </form>

          <motion.p
            className="text-xs text-muted-foreground text-center leading-relaxed mt-4"
            variants={fadeInUp}
          >
            Bằng việc tiếp tục với Google, Facebook, Email bạn đồng ý với Điều khoản dịch vụ và
            Chính sách bảo mật của chúng tôi.
          </motion.p>

          <motion.p className="text-sm text-muted-foreground text-center" variants={fadeInUp}>
            Chưa có tài khoản?{" "}
            <Link
              href="/register"
              className="font-semibold text-foreground hover:underline underline-offset-2"
            >
              Đăng ký
            </Link>
          </motion.p>
        </div>
      </motion.div>

      <motion.div
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden bg-[#0a0f1c]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
    </div>
  );
}
