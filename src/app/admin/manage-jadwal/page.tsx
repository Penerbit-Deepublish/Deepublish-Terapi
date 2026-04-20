"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangeFilter } from "@/components/admin/date-range-filter";

interface JadwalTanggalItem {
  id: string;
  tanggal: string;
  kuota_max: number;
  kuota_terpakai: number;
}

const PAGE_SIZE = 15;

async function parseJsonSafely(res: Response) {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { success?: boolean; message?: string; data?: unknown };
  } catch {
    return null;
  }
}

export default function ManageJadwalPage() {
  const [jadwal, setJadwal] = useState<JadwalTanggalItem[]>([]);
  const [tanggal, setTanggal] = useState("");
  const [kuotaMax, setKuotaMax] = useState(10);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const loadJadwal = useCallback(async (from: string, to: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/admin/kuota?${params.toString()}`);
      const json = await parseJsonSafely(res);
      if (!res.ok || !json?.success) {
        setError(json?.message || "Gagal memuat jadwal");
        return;
      }
      setJadwal((json.data as JadwalTanggalItem[]) ?? []);
      setCurrentPage(1);
    } catch {
      setError("Terjadi kesalahan jaringan saat memuat jadwal");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJadwal("", "");
  }, [loadJadwal]);

  const simpanTanggal = async () => {
    setError("");
    setMessage("");
    if (!tanggal) {
      setError("Tanggal wajib dipilih");
      return;
    }

    const res = await fetch("/api/admin/kuota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tanggal, kuota_max: kuotaMax }),
    });
    const json = await parseJsonSafely(res);

    if (!res.ok || !json?.success) {
      setError(json?.message || "Gagal menyimpan jadwal tanggal");
      return;
    }

    setMessage(`Jadwal tanggal ${tanggal} berhasil disimpan`);
    await loadJadwal(dateFrom, dateTo);
  };

  const deleteJadwal = async (tanggalValue: string) => {
    setError("");
    setMessage("");
    const confirmed = window.confirm(`Hapus jadwal tanggal ${tanggalValue}?`);
    if (!confirmed) return;

    const res = await fetch(`/api/admin/kuota?tanggal=${encodeURIComponent(tanggalValue)}`, {
      method: "DELETE",
    });
    const json = await parseJsonSafely(res);
    if (!res.ok || !json?.success) {
      setError(json?.message || "Gagal menghapus jadwal");
      return;
    }

    setMessage(`Jadwal tanggal ${tanggalValue} berhasil dihapus`);
    await loadJadwal(dateFrom, dateTo);
  };

  const totalPages = Math.max(1, Math.ceil(jadwal.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedJadwal = jadwal.slice(startIndex, startIndex + PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-72 rounded-xl bg-slate-200" />
        <div className="h-40 rounded-2xl bg-slate-200" />
        <div className="h-72 rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}

      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle>Tambah / Ubah Jadwal Tanggal</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Kuota Maksimum Harian</Label>
            <Input
              type="number"
              min={1}
              value={kuotaMax}
              onChange={(e) => setKuotaMax(Number(e.target.value || 1))}
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={simpanTanggal}>
              <Save className="w-4 h-4 mr-2" /> Simpan Jadwal
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle>Daftar Jadwal Aktif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DateRangeFilter
            embedded
            from={dateFrom}
            to={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
            onApply={() => {
              if (dateFrom && dateTo && dateTo < dateFrom) {
                setError("Tanggal selesai tidak boleh lebih kecil dari tanggal mulai.");
                return;
              }
              setError("");
              void loadJadwal(dateFrom, dateTo);
            }}
            onReset={() => {
              setDateFrom("");
              setDateTo("");
              setError("");
              void loadJadwal("", "");
            }}
            isLoading={isLoading}
          />
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kuota Maks</TableHead>
                  <TableHead>Terpakai</TableHead>
                  <TableHead>Sisa</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedJadwal.length > 0 ? paginatedJadwal.map((item) => {
                  const sisa = Math.max(0, item.kuota_max - item.kuota_terpakai);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.tanggal}</TableCell>
                      <TableCell>{item.kuota_max}</TableCell>
                      <TableCell>{item.kuota_terpakai}</TableCell>
                      <TableCell>{sisa}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => deleteJadwal(item.tanggal)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                      Tidak ada data jadwal
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages} • {PAGE_SIZE} data per halaman
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
