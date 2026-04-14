"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Save } from "lucide-react";

interface KuotaItem {
  id: string;
  tanggal: string;
  kuota_max: number;
  kuota_terpakai: number;
}

export default function ManageKuota() {
  const [kuotaData, setKuotaData] = useState<KuotaItem[]>([]);
  const [singleEdits, setSingleEdits] = useState<Record<string, number>>({});
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [kuotaMassal, setKuotaMassal] = useState(10);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadKuota = useCallback(async () => {
    const res = await fetch("/api/admin/kuota");
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.message || "Gagal memuat kuota");
      return;
    }
    setKuotaData(json.data);
    setSingleEdits(
      Object.fromEntries((json.data as KuotaItem[]).map((item) => [item.id, item.kuota_max])),
    );
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadKuota();
  }, [loadKuota]);

  const applyMassal = async () => {
    setError("");
    setMessage("");

    const res = await fetch("/api/admin/kuota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        kuota_max: kuotaMassal,
      }),
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      setError(json.message || "Gagal menerapkan kuota massal");
      return;
    }

    setMessage("Kuota massal berhasil disimpan");
    await loadKuota();
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
    await loadKuota();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Settings className="w-8 h-8" /> Manajemen Kuota
        </h1>
        <p className="text-muted-foreground mt-1">Atur kuota ketersediaan jadwal terapi per hari.</p>
      </div>

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
                min={1}
                onChange={(e) => setKuotaMassal(Number(e.target.value || 1))}
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
          <CardContent>
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
                  {kuotaData.map((k) => (
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => saveRow(k.tanggal, singleEdits[k.id] ?? k.kuota_max)}
                        >
                          Simpan
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
