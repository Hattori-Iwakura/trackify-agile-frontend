"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Input, Label } from "@/components/ui";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export default function SignUpPage() {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="min-h-screen flex">
      {/* Left: Form - Đăng ký */}
      <motion.div
        className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-background px-8 py-12 lg:px-16 shadow-lg"
        initial="initial"
        animate="animate"
        variants={stagger}
      >
        <div className="w-full max-w-sm flex flex-col gap-6">
          <motion.h1
            className="text-3xl font-bold text-foreground"
            variants={fadeInUp}
          >
            Đăng ký tài khoản
          </motion.h1>

          <div className="flex flex-col gap-3">
            <motion.div variants={fadeInUp}>
              <Button variant="outline" className="w-full h-12 rounded-xl gap-2" type="button">
                <UserIcon className="w-5 h-5" />
                <span>Tiếp tục với Email</span>
              </Button>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <Button variant="outline" className="w-full h-12 rounded-xl gap-2" type="button">
                <GoogleIcon className="w-5 h-5" />
                <span>Tiếp tục với Google</span>
              </Button>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <Button variant="outline" className="w-full h-12 rounded-xl gap-2" type="button">
                <FacebookIcon className="w-5 h-5" />
                <span>Tiếp tục với Facebook</span>
              </Button>
            </motion.div>
          </div>

          <motion.div variants={fadeInUp} className="flex flex-col gap-3">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Họ và tên</Label>
              <Input id="signup-name" type="text" placeholder="Họ và tên" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input id="signup-email" type="email" placeholder="Email" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Mật khẩu</Label>
              <Input id="signup-password" type="password" placeholder="Mật khẩu" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-confirm">Xác nhận mật khẩu</Label>
              <Input id="signup-confirm" type="password" placeholder="Xác nhận mật khẩu" className="h-12 rounded-xl" />
            </div>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Button type="button" className="w-full h-12 rounded-xl shadow-sm">
              Đăng ký
            </Button>
          </motion.div>

          <motion.p
            className="text-xs text-muted-foreground text-center leading-relaxed"
            variants={fadeInUp}
          >
            Bằng việc tiếp tục với Google, Facebook, Email bạn đồng ý với Điều
            khoản dịch vụ và Chính sách bảo mật của chúng tôi.
          </motion.p>

          <motion.p
            className="text-sm text-muted-foreground text-center"
            variants={fadeInUp}
          >
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-2">
              Đăng nhập
            </Link>
          </motion.p>
        </div>
      </motion.div>

      {/* Right: Laptop image */}
      <motion.div
        className="hidden lg:flex lg:w-1/2 relative bg-foreground items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="relative w-full h-full min-h-[500px]">
          {!imgError ? (
            // Không dùng next/image: file thiếu gây 400 từ optimizer
            <img
              src="/hero-image.png"
              alt="Laptop with code editor"
              className="absolute inset-0 h-full w-full object-cover object-center"
              onError={() => setImgError(true)}
            />
          ) : null}
          <div
            className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground/95 to-foreground"
            aria-hidden
          />
        </div>
      </motion.div>
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="#1877F2" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
