"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Trash2 } from "lucide-react";
import { DateRangeFilter } from "@/components/admin/date-range-filter";

interface KuotaItem {
  id: string;
  tanggal: string;
  kuota_max: number; 
  kuota_terpakai: number;
}

const PAGE_SIZE = 15;

export default function ManageKuota() {
  const [kuotaData, setKuotaData] = useState<KuotaItem[]>([]);
  const [singleEdits, setSingleEdits] = useState<Record<string, number>>({});
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [kuotaMassal, setKuotaMassal] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadKuota = useCallback(async (from: string, to: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/admin/kuota?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Gagal memuat kuota");
        return;
      }
      setKuotaData(json.data);
      setCurrentPage(1);
      setSingleEdits(
        Object.fromEntries((json.data as KuotaItem[]).map((item) => [item.id, item.kuota_max])),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKuota("", "");
  }, [loadKuota]);

  const applyMassal = async () => {
    setError("");
    setMessage("");
    if (!tanggalMulai || !tanggalSelesai) {
      setError("Tanggal mulai dan tanggal selesai wajib diisi sebelum penyesuaian kuota.");
      return;
    }
    if (tanggalSelesai < tanggalMulai) {
      setError("Tanggal selesai tidak boleh lebih kecil dari tanggal mulai.");
      return;
    }
    if (!kuotaMassal.trim()) {
      setError("Kuota maksimum per hari wajib diisi.");
      return;
    }
    const kuotaMassalNumber = Number(kuotaMassal);
    if (!Number.isFinite(kuotaMassalNumber) || kuotaMassalNumber < 1) {
      setError("Kuota maksimum per hari minimal 1.");
      return;
    }

    const res = await fetch("/api/admin/kuota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        kuota_max: kuotaMassalNumber,
      }),
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      setError(json.message || "Gagal menerapkan kuota massal");
      return;
    }

    setMessage("Kuota massal berhasil disimpan");
    await loadKuota(dateFrom, dateTo);
  };

  const saveRow = async (tanggal: string, kuotaMax: number) => {
    setError("");
    setMessage("");

    const res = await fetch("/api/admin/kuota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tanggal, kuota_max: kuotaMax }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.message || "Gagal menyimpan kuota");
      return;
    }

    setMessage(`Kuota tanggal ${tanggal} diperbarui`);
    await loadKuota(dateFrom, dateTo);
  };

  const deleteRow = async (tanggal: string) => {
    setError("");
    setMessage("");
    const confirmed = window.confirm(`Hapus kuota untuk tanggal ${tanggal}?`);
    if (!confirmed) return;

    const res = await fetch(`/api/admin/kuota?tanggal=${encodeURIComponent(tanggal)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.message || "Gagal menghapus kuota");
      return;
    }

    setMessage(`Kuota tanggal ${tanggal} berhasil dihapus`);
    await loadKuota(dateFrom, dateTo);
  };

  const totalPages = Math.max(1, Math.ceil(kuotaData.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedKuota = kuotaData.slice(startIndex, startIndex + PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-72 rounded-xl bg-slate-200" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 rounded-2xl bg-slate-200" />
          <div className="lg:col-span-2 h-80 rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-sm border-border">
          <CardHeader>
            <CardTitle>Pengaturan Massal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Selesai</Label>
              <Input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Kuota Maksimum Per Hari</Label>
              <Input
                type="number"
                value={kuotaMassal}
                placeholder="Contoh: 10"
                min={1}
                onChange={(e) => setKuotaMassal(e.target.value)}
              />
            </div>
            <Button className="w-full mt-4" onClick={applyMassal}>
              <Save className="w-4 h-4 mr-2" /> Terapkan Penyesuaian
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm border-border">
        <CardHeader>
          <CardTitle>Daftar Pengaturan Kuota</CardTitle>
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
              void loadKuota(dateFrom, dateTo);
            }}
            onReset={() => {
              setDateFrom("");
              setDateTo("");
              setError("");
              void loadKuota("", "");
            }}
            isLoading={isLoading}
          />
          <div className="border rounded-md">
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Maks Kuota</TableHead>
                    <TableHead>Terpakai</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedKuota.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium">{k.tanggal}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={singleEdits[k.id] ?? k.kuota_max}
                          onChange={(e) =>
                            setSingleEdits((prev) => ({ ...prev, [k.id]: Number(e.target.value || 1) }))
                          }
                          className="w-24 h-8"
                        />
                      </TableCell>
                      <TableCell>{k.kuota_terpakai}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => saveRow(k.tanggal, singleEdits[k.id] ?? k.kuota_max)}
                          >
                            Simpan
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => deleteRow(k.tanggal)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
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
    </div>
  );
}
