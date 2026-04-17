"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Pencil, Trash2, X } from "lucide-react";
import { Label } from "@/components/ui/label";

interface PenggunaItem {
  id: string;
  email: string;
}

interface PenggunaResponse {
  items: PenggunaItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 15;

export default function DataPenggunaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<PenggunaResponse | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<PenggunaItem | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeEmail, setActiveEmail] = useState("");

  const loadData = useCallback(async (targetPage = page, q = searchTerm) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(PAGE_SIZE),
      });
      if (q) params.set("q", q);

      const res = await fetch(`/api/admin/pengguna?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Gagal memuat data pengguna");
        return;
      }

      setData(json.data);
      setPage(targetPage);
      setError("");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    void loadData(1, "");
  }, [loadData]);

  useEffect(() => {
    const loadProfile = async () => {
      const res = await fetch("/api/admin/profile");
      const json = await res.json();
      if (!res.ok || !json.success) return;
      setActiveEmail((json.data.email || "").toLowerCase());
    };
    void loadProfile();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setEmail("");
    setPassword("");
    setIsFormOpen(false);
  };

  const openCreate = () => {
    setSuccess("");
    setError("");
    setEditing(null);
    setEmail("");
    setPassword("");
    setIsFormOpen(true);
  };

  const openEdit = (item: PenggunaItem) => {
    setSuccess("");
    setError("");
    setEditing(item);
    setEmail(item.email);
    setPassword("");
    setIsFormOpen(true);
  };

  const onSubmit = async () => {
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email wajib diisi");
      return;
    }

    if (!editing && password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    if (editing && password && password.length < 8) {
      setError("Password baru minimal 8 karakter");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editing ? `/api/admin/pengguna/${editing.id}` : "/api/admin/pengguna";
      const method = editing ? "PATCH" : "POST";
      const body = editing
        ? JSON.stringify({ email, ...(password ? { password } : {}) })
        : JSON.stringify({ email, password });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Gagal menyimpan pengguna");
        return;
      }

      setSuccess(editing ? "Pengguna berhasil diperbarui" : "Pengguna berhasil ditambahkan");
      resetForm();
      await loadData(page, searchTerm);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async (item: PenggunaItem) => {
    const confirmed = window.confirm(`Hapus pengguna ${item.email}?`);
    if (!confirmed) return;

    setError("");
    setSuccess("");

    const res = await fetch(`/api/admin/pengguna/${item.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.message || "Gagal menghapus pengguna");
      return;
    }

    setSuccess("Pengguna berhasil dihapus");
    await loadData(page, searchTerm);
  };

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalData = data?.total ?? 0;
  const formTitle = useMemo(() => (editing ? "Edit Pengguna" : "Tambah Pengguna"), [editing]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-72 rounded-xl bg-slate-200" />
        <div className="h-[420px] rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Data Pengguna</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola akun admin yang dapat mengakses halaman admin.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Pengguna
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      {isFormOpen && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">{formTitle}</h2>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4 mr-1" /> Tutup
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pengguna-email">Email</Label>
                <Input
                  id="pengguna-email"
                  type="email"
                  placeholder="nama@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pengguna-password">
                  {editing ? "Password Baru (opsional)" : "Password"}
                </Label>
                <Input
                  id="pengguna-password"
                  type="password"
                  placeholder={editing ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>Batal</Button>
              <Button onClick={onSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Pengguna"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari email pengguna..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => loadData(1, searchTerm)}>Cari</Button>
          </div>

          <div className="border-t overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length > 0 ? items.map((item) => {
                  const isCurrent = item.email.toLowerCase() === activeEmail;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-muted-foreground">{item.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-medium">{item.email}</TableCell>
                      <TableCell>
                        {isCurrent ? <Badge>Anda</Badge> : <Badge variant="secondary">Aktif</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(item)}
                            disabled={isCurrent}
                            title={isCurrent ? "Akun aktif tidak bisa dihapus" : "Hapus pengguna"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      Tidak ada data pengguna
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Total {totalData} pengguna • Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadData(page - 1, searchTerm)}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => loadData(page + 1, searchTerm)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
