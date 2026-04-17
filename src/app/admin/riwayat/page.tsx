"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
import { DateRangeFilter } from "@/components/admin/date-range-filter";

interface PesertaItem {
  id: string;
  nama_lengkap: string;
  tanggal_terapi: string;
  departemen: string | null;
  status_kepesertaan: string | null;
  tanggal_lahir: string | null;
  jenis_kelamin: "L" | "P";
  jam_kehadiran: string;
  keluhan_luar: string[];
  keluhan_luar_lainnya?: string | null;
  keluhan_dalam: string[];
  keluhan_dalam_lainnya?: string | null;
  paket: string;
}

interface PesertaResponse {
  items: PesertaItem[];
  page: number;
  pageSize: number;
  totalPages: number;
}

const PAGE_SIZE = 15;

export default function RiwayatPeserta() {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<PesertaResponse | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadData = useCallback(async (targetPage: number, q: string, from: string, to: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
      if (q) params.set("q", q);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/admin/peserta?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Gagal memuat data");
        return;
      }

      setError("");
      setData(json.data);
      setPage(targetPage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(1, "", "", "");
  }, [loadData]);

  const onDelete = async (id: string) => {
    const res = await fetch(`/api/admin/peserta/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.message || "Gagal menghapus peserta");
      return;
    }

    await loadData(page, searchTerm, dateFrom, dateTo);
  };

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

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
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="space-y-3 border-b p-4">
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
                void loadData(1, searchTerm, dateFrom, dateTo);
              }}
              onReset={() => {
                setDateFrom("");
                setDateTo("");
                setError("");
                void loadData(1, searchTerm, "", "");
              }}
              isLoading={isLoading}
            />

            <div className="flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, departemen, atau status..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => loadData(1, searchTerm, dateFrom, dateTo)}>Cari</Button>
            </div>
          </div>
          <div className="border-t overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Peserta</TableHead>
                  <TableHead>Tanggal Terapi</TableHead>
                  <TableHead>Profil</TableHead>
                  <TableHead>Jam Kehadiran</TableHead>
                  <TableHead>Keluhan Luar</TableHead>
                  <TableHead>Keluhan Dalam</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length > 0 ? items.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </TableCell>
                    <TableCell className="font-bold">{item.nama_lengkap}</TableCell>
                    <TableCell>{item.tanggal_terapi}</TableCell>
                    <TableCell>
                      <div className="text-sm">{item.departemen || "-"}</div>
                      <div className="text-sm text-muted-foreground">{item.status_kepesertaan || "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"} • {item.tanggal_lahir || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold text-primary">{item.jam_kehadiran}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.keluhan_luar.map((k) => (
                          <Badge variant="secondary" key={k} className="text-xs">{k}</Badge>
                        ))}
                        {item.keluhan_luar_lainnya && (
                          <Badge variant="secondary" className="text-xs">{`Yang lain: ${item.keluhan_luar_lainnya}`}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.keluhan_dalam.map((k) => (
                          <Badge variant="secondary" key={k} className="text-xs">{k}</Badge>
                        ))}
                        {item.keluhan_dalam_lainnya && (
                          <Badge variant="secondary" className="text-xs">{`Yang lain: ${item.keluhan_dalam_lainnya}`}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.paket === "LENGKAP" ? "default" : "outline"}>
                        {item.paket}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                      Tidak ada data ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 border-t flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Halaman {page} dari {totalPages} • {PAGE_SIZE} data per halaman
            </p>
            <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadData(page - 1, searchTerm, dateFrom, dateTo)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => loadData(page + 1, searchTerm, dateFrom, dateTo)}
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
