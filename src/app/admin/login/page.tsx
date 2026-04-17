"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import LogoLight from "@/app/2.png";
import LoginBackground from "@/app/login.png";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState("");

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const raw = await res.text();
      let json: { success?: boolean; message?: string } = {};
      if (raw) {
        try {
          json = JSON.parse(raw) as { success?: boolean; message?: string };
        } catch {
          json = {};
        }
      }

      if (res.ok && json.success) {
        router.push("/admin/dashboard");
        return;
      }

      setError(json.message || "Gagal login. Cek konfigurasi backend/API.");
    } catch {
      setError("Tidak dapat terhubung ke server.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 md:justify-end md:p-8 lg:p-12">
      <Image
        src={LoginBackground}
        alt="Background login"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[#0b1b33]/35" />
      <div className="absolute right-0 bottom-0 h-24 w-44 bg-[#0b1b33]/92 md:h-28 md:w-52" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xl rounded-3xl border border-white/40 bg-white/92 p-8 shadow-2xl backdrop-blur-sm md:mr-12 md:p-10 lg:mr-20"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Image
              src={LogoLight}
              alt="Logo Terapi Bio Elektrik Deepublish"
              width={40}
              height={40}
              priority
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-primary">Login Admin</h1>
          <p className="text-muted-foreground mt-2">Masuk ke panel manajemen Terapi</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input {...form.register("email")} className="pl-10 py-6" placeholder="nama@perusahaan.com" />
            </div>
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="password"
                {...form.register("password")}
                className="pl-10 py-6"
                placeholder="Masukkan kata sandi akun admin"
              />
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
            )}
          </div>

          {error && <p className="text-sm text-red-500 text-center font-medium bg-red-50 p-3 rounded-lg">{error}</p>}

          <Button type="submit" className="w-full py-6 text-lg rounded-xl">
            Login
          </Button>
        </form>

        <Link
          href="/"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-border bg-background px-2.5 py-6 text-base font-medium transition-all hover:bg-muted hover:text-foreground"
        >
          Kembali ke Beranda
        </Link>
      </motion.div>
    </div>
  );
}
