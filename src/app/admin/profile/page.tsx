"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserCircle2 } from "lucide-react";
import { DEFAULT_ADMIN_AVATAR } from "@/lib/constants";

export default function AdminProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState(DEFAULT_ADMIN_AVATAR);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/profile");
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.message || "Gagal memuat profil");
          return;
        }
        setName(json.data.name || "");
        setEmail(json.data.email || "");
        setAvatar(json.data.avatar || DEFAULT_ADMIN_AVATAR);
      } catch {
        setError("Tidak dapat terhubung ke server");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, avatar }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Gagal menyimpan profil");
        return;
      }

      setName(json.data.name || name);
      setEmail(json.data.email || email);
      setAvatar(json.data.avatar || avatar);
      setMessage("Profil berhasil diperbarui");
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setIsSaving(false);
    }
  };

  const onChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/admin/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setPasswordError(json.message || "Gagal mengubah password");
        return;
      }
      setPasswordMessage("Password berhasil diperbarui");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Tidak dapat terhubung ke server");
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-primary">Profile</h1>
        <p className="text-muted-foreground">Memuat data profil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <UserCircle2 className="h-8 w-8" />
          Profile Admin
        </h1>
        <p className="text-muted-foreground mt-1">Perbarui informasi akun dan foto profil Anda.</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="flex items-center gap-4">
              <Image
                src={avatar || DEFAULT_ADMIN_AVATAR}
                alt="Avatar Admin"
                width={72}
                height={72}
                className="h-[72px] w-[72px] rounded-full border border-border object-cover"
              />
              <p className="text-sm text-muted-foreground">
                Avatar default: Pinterest profile image.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-name">Nama Lengkap</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Masukkan nama lengkap admin"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@perusahaan.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-avatar">URL Avatar</Label>
              <Input
                id="profile-avatar"
                type="url"
                value={avatar}
                onChange={(event) => setAvatar(event.target.value)}
                placeholder={DEFAULT_ADMIN_AVATAR}
                required
              />
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Ubah Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onChangePassword} className="space-y-5">
            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            {passwordMessage && <p className="text-sm text-emerald-600">{passwordMessage}</p>}

            <div className="space-y-2">
              <Label htmlFor="current-password">Password Saat Ini</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Masukkan password saat ini"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Ulangi password baru"
                required
              />
            </div>

            <Button type="submit" disabled={isSavingPassword}>
              {isSavingPassword ? "Menyimpan..." : "Ubah Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
