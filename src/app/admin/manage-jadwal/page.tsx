"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface JadwalTanggalItem {
  id: string;
  tanggal: string;
  kuota_max: number;
  kuota_terpakai: number;
}

export default function ManageJadwalPage() {
  const [jadwal, setJadwal] = useState<JadwalTanggalItem[]>([]);
  const [tanggal, setTanggal] = useState("");
  const [kuotaMax, setKuotaMax] = useState(10);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadJadwal = useCallback(async () => {
    const res = await fetch("/api/admin/kuota");
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.message || "Gagal memuat jadwal");
      return;
    }
    setJadwal(json.data as JadwalTanggalItem[]);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadJadwal();
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
    const json = await res.json();

    if (!res.ok || !json.success) {
      setError(json.message || "Gagal menyimpan jadwal tanggal");
      return;
    }

    setMessage(`Jadwal tanggal ${tanggal} berhasil disimpan`);
    await loadJadwal();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <CalendarDays className="w-8 h-8" /> Manage Jadwal Tanggal
        </h1>
        <p className="text-muted-foreground mt-1">
          Tentukan tanggal jadwal yang aktif untuk pemesanan customer.
        </p>
      </div>

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
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kuota Maks</TableHead>
                  <TableHead>Terpakai</TableHead>
                  <TableHead>Sisa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jadwal.map((item) => {
                  const sisa = Math.max(0, item.kuota_max - item.kuota_terpakai);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.tanggal}</TableCell>
                      <TableCell>{item.kuota_max}</TableCell>
                      <TableCell>{item.kuota_terpakai}</TableCell>
                      <TableCell>{sisa}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
