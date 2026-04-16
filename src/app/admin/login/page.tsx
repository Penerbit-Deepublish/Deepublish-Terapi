"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

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
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card p-8 rounded-3xl shadow-2xl border border-border"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Login Admin</h1>
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
      </motion.div>
    </div>
  );
}
