"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Search, Trash2 } from "lucide-react";
import {
  INSTANSI_OPTIONS,
  getStatusKepesertaanOptions,
  isInstansi,
  isStatusKepesertaan,
  type Instansi,
  type StatusKepesertaan,
} from "@/lib/kepesertaan";

interface PesertaItem {
  id: string;
  nama_lengkap: string;
  tanggal_terapi: string;
  sesi_id: string;
  departemen: string | null;
  instansi: Instansi;
  status_kepesertaan: StatusKepesertaan | null;
  tanggal_lahir: string | null;
  jenis_kelamin: "L" | "P";
  jam_kehadiran: string;
  keluhan_luar: string[];
  keluhan_luar_lainnya?: string | null;
  keluhan_dalam: string[];
  keluhan_dalam_lainnya?: string | null;
  paket: "LENGKAP" | "SEBAGIAN";
}

interface PesertaResponse {
  items: PesertaItem[];
  page: number;
  pageSize: number;
  totalPages: number;
}

interface SesiItem {
  id: string;
  jam: string;
}

interface EditFormState {
  id: string;
  nama_lengkap: string;
  departemen: string;
  instansi: Instansi | "";
  status_kepesertaan: StatusKepesertaan | "";
  tanggal_terapi: string;
  tanggal_lahir: string;
  jenis_kelamin: "L" | "P" | "";
  sesi_id: string;
  keluhan_luar: string[];
  keluhan_luar_lainnya: string;
  keluhan_dalam: string[];
  keluhan_dalam_lainnya: string;
  paket: "LENGKAP" | "SEBAGIAN" | "";
}

const PAGE_SIZE = 15;
const OTHER_OPTION = "Yang lain";

const KELUHAN_LUAR_OPTIONS = [
  "Sakit Gigi",
  "Pusing berulang/menahun",
  "Sakit Syaraf",
  "Sakit Sendi",
  "Sakit Pinggang",
  "Saraf Kejepit (HNP)",
  "Keseleo/Terkilir",
  "Tulang Geser",
  "Sakit kaki sebelah sampai pantat (perefromis)",
  "Mata Minus Plus Silinder",
  OTHER_OPTION,
] as const;

const KELUHAN_DALAM_OPTIONS = [
  "Kanker",
  "Stroke",
  "Liver",
  "Jantung",
  "Prostat",
  "Diabetes",
  "Ambeyen",
  "Asma/Penyakit Pernapasan",
  "Batu Empedu",
  "Asam Lambung/Gerd/magh",
  OTHER_OPTION,
] as const;

function toggleValue(list: string[], value: string, checked: boolean) {
  const next = new Set(list);
  if (checked) next.add(value);
  else next.delete(value);
  return Array.from(next);
}

export default function RiwayatPeserta() {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<PesertaResponse | null>(null);
  const [sessions, setSessions] = useState<SesiItem[]>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editing, setEditing] = useState<EditFormState | null>(null);

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

  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/admin/sesi");
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.message || "Gagal memuat sesi");
      return;
    }

    setSessions((json.data as SesiItem[]) ?? []);
  }, []);

  useEffect(() => {
    void Promise.all([loadData(1, "", "", ""), loadSessions()]);
  }, [loadData, loadSessions]);

  const resetEdit = () => {
    setEditing(null);
  };

  const openEdit = (item: PesertaItem) => {
    setSuccess("");
    setError("");
    setEditing({
      id: item.id,
      nama_lengkap: item.nama_lengkap,
      departemen: item.departemen || "",
      instansi: item.instansi || "",
      status_kepesertaan: item.status_kepesertaan || "",
      tanggal_terapi: item.tanggal_terapi,
      tanggal_lahir: item.tanggal_lahir || "",
      jenis_kelamin: item.jenis_kelamin,
      sesi_id: item.sesi_id,
      keluhan_luar: item.keluhan_luar || [],
      keluhan_luar_lainnya: item.keluhan_luar_lainnya || "",
      keluhan_dalam: item.keluhan_dalam || [],
      keluhan_dalam_lainnya: item.keluhan_dalam_lainnya || "",
      paket: item.paket,
    });
  };

  const onSaveEdit = async () => {
    if (!editing) return;

    setError("");
    setSuccess("");

    if (!editing.nama_lengkap.trim()) return setError("Nama lengkap wajib diisi");
    if (!editing.departemen.trim()) return setError("Departemen wajib diisi");
    if (!editing.instansi) return setError("Instansi wajib dipilih");
    if (!editing.status_kepesertaan) return setError("Status kepesertaan wajib dipilih");
    if (!editing.tanggal_terapi) return setError("Tanggal terapi wajib diisi");
    if (!editing.tanggal_lahir) return setError("Tanggal lahir wajib diisi");
    if (!editing.jenis_kelamin) return setError("Jenis kelamin wajib dipilih");
    if (!editing.sesi_id) return setError("Jam kehadiran wajib dipilih");
    if (!editing.paket) return setError("Paket wajib dipilih");

    const hasKeluhan =
      editing.keluhan_luar.length > 0 ||
      editing.keluhan_dalam.length > 0 ||
      Boolean(editing.keluhan_luar_lainnya.trim()) ||
      Boolean(editing.keluhan_dalam_lainnya.trim());
    if (!hasKeluhan) return setError("Pilih minimal satu keluhan atau isi yang lain");

    if (editing.keluhan_luar.includes(OTHER_OPTION) && !editing.keluhan_luar_lainnya.trim()) {
      return setError("Isi detail 'Yang lain' untuk keluhan luar");
    }
    if (editing.keluhan_dalam.includes(OTHER_OPTION) && !editing.keluhan_dalam_lainnya.trim()) {
      return setError("Isi detail 'Yang lain' untuk keluhan dalam");
    }

    const payload = {
      nama_lengkap: editing.nama_lengkap,
      departemen: editing.departemen,
      instansi: editing.instansi,
      status_kepesertaan: editing.status_kepesertaan,
      tanggal_terapi: editing.tanggal_terapi,
      tanggal_lahir: editing.tanggal_lahir,
      jenis_kelamin: editing.jenis_kelamin,
      sesi_id: editing.sesi_id,
      paket: editing.paket,
      keluhan_luar: editing.keluhan_luar.filter((item) => item !== OTHER_OPTION),
      keluhan_luar_lainnya: editing.keluhan_luar_lainnya.trim() || undefined,
      keluhan_dalam: editing.keluhan_dalam.filter((item) => item !== OTHER_OPTION),
      keluhan_dalam_lainnya: editing.keluhan_dalam_lainnya.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/peserta/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const firstFieldError = Object.values(json?.details?.fieldErrors ?? {}).find(
          (messages): messages is string[] => Array.isArray(messages) && messages.length > 0,
        )?.[0];
        const detailMessage = json?.details?.formErrors?.[0] || firstFieldError;
        setError(detailMessage || json.message || "Gagal memperbarui peserta");
        return;
      }

      setSuccess("Data peserta berhasil diperbarui");
      resetEdit();
      await loadData(page, searchTerm, dateFrom, dateTo);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`Hapus data peserta ${name}?`);
    if (!confirmed) return;

    setSuccess("");
    const res = await fetch(`/api/admin/peserta/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.message || "Gagal menghapus peserta");
      return;
    }

    setSuccess("Data peserta berhasil dihapus");
    await loadData(page, searchTerm, dateFrom, dateTo);
  };

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const editStatusOptions = getStatusKepesertaanOptions(editing?.instansi ?? "");

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
      {success && <p className="text-sm text-green-600">{success}</p>}

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) resetEdit();
        }}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] p-0 sm:max-w-4xl">
          {editing && (
            <div className="max-h-[85vh] overflow-y-auto">
              <DialogHeader className="border-b p-5">
                <DialogTitle>Edit Riwayat Peserta</DialogTitle>
                <DialogDescription>
                  Ubah data peserta lalu simpan perubahan.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nama Lengkap</Label>
                    <Input
                      value={editing.nama_lengkap}
                      onChange={(e) => setEditing((prev) => (prev ? { ...prev, nama_lengkap: e.target.value } : prev))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Departemen</Label>
                    <Input
                      value={editing.departemen}
                      onChange={(e) => setEditing((prev) => (prev ? { ...prev, departemen: e.target.value } : prev))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Instansi dan Status Kepesertaan</Label>
                    <Select
                      value={editing.instansi}
                      onValueChange={(value) =>
                        setEditing((prev) => {
                          if (!prev) return prev;
                          return isInstansi(value)
                            ? { ...prev, instansi: value, status_kepesertaan: "" }
                            : { ...prev, instansi: "", status_kepesertaan: "" };
                        })
                      }
                    >
                      <SelectTrigger className="mb-2">
                        <SelectValue placeholder="Pilih instansi" />
                      </SelectTrigger>
                      <SelectContent>
                        {INSTANSI_OPTIONS.map((instansi) => (
                          <SelectItem key={instansi} value={instansi}>
                            {instansi}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={editing.status_kepesertaan}
                      onValueChange={(value) =>
                        setEditing((prev) => {
                          if (!prev) return prev;
                          if (isStatusKepesertaan(value)) {
                            return { ...prev, status_kepesertaan: value };
                          }
                          return { ...prev, status_kepesertaan: "" };
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        {editStatusOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal Terapi</Label>
                    <Input
                      type="date"
                      value={editing.tanggal_terapi}
                      onChange={(e) => setEditing((prev) => (prev ? { ...prev, tanggal_terapi: e.target.value } : prev))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal Lahir</Label>
                    <Input
                      type="date"
                      value={editing.tanggal_lahir}
                      onChange={(e) => setEditing((prev) => (prev ? { ...prev, tanggal_lahir: e.target.value } : prev))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Jenis Kelamin</Label>
                    <Select
                      value={editing.jenis_kelamin}
                      onValueChange={(value) =>
                        setEditing((prev) => {
                          if (!prev) return prev;
                          if (value === "L" || value === "P") {
                            return { ...prev, jenis_kelamin: value };
                          }
                          return { ...prev, jenis_kelamin: "" };
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Laki-laki</SelectItem>
                        <SelectItem value="P">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Jam Kehadiran</Label>
                    <Select
                      value={editing.sesi_id}
                      onValueChange={(value) =>
                        setEditing((prev) => (prev ? { ...prev, sesi_id: value ?? "" } : prev))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih sesi" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>{session.jam}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Paket</Label>
                    <Select
                      value={editing.paket}
                      onValueChange={(value) =>
                        setEditing((prev) => {
                          if (!prev) return prev;
                          if (value === "LENGKAP" || value === "SEBAGIAN") {
                            return { ...prev, paket: value };
                          }
                          return { ...prev, paket: "" };
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih paket" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LENGKAP">LENGKAP</SelectItem>
                        <SelectItem value="SEBAGIAN">SEBAGIAN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Keluhan Luar</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {KELUHAN_LUAR_OPTIONS.map((keluhan) => {
                        const checked = editing.keluhan_luar.includes(keluhan);
                        return (
                          <label key={keluhan} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setEditing((prev) =>
                                  prev
                                    ? { ...prev, keluhan_luar: toggleValue(prev.keluhan_luar, keluhan, e.target.checked) }
                                    : prev,
                                )
                              }
                            />
                            {keluhan}
                          </label>
                        );
                      })}
                    </div>
                    {editing.keluhan_luar.includes(OTHER_OPTION) && (
                      <Input
                        placeholder="Detail keluhan luar lainnya"
                        value={editing.keluhan_luar_lainnya}
                        onChange={(e) =>
                          setEditing((prev) => (prev ? { ...prev, keluhan_luar_lainnya: e.target.value } : prev))
                        }
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Keluhan Dalam</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {KELUHAN_DALAM_OPTIONS.map((keluhan) => {
                        const checked = editing.keluhan_dalam.includes(keluhan);
                        return (
                          <label key={keluhan} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setEditing((prev) =>
                                  prev
                                    ? { ...prev, keluhan_dalam: toggleValue(prev.keluhan_dalam, keluhan, e.target.checked) }
                                    : prev,
                                )
                              }
                            />
                            {keluhan}
                          </label>
                        );
                      })}
                    </div>
                    {editing.keluhan_dalam.includes(OTHER_OPTION) && (
                      <Input
                        placeholder="Detail keluhan dalam lainnya"
                        value={editing.keluhan_dalam_lainnya}
                        onChange={(e) =>
                          setEditing((prev) => (prev ? { ...prev, keluhan_dalam_lainnya: e.target.value } : prev))
                        }
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t p-5">
                <Button variant="outline" onClick={resetEdit} disabled={isSubmitting}>Batal</Button>
                <Button onClick={onSaveEdit} disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              <div className="relative max-w-sm flex-1">
                <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                <Input
                  placeholder="Cari nama, departemen, instansi, atau status..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => loadData(1, searchTerm, dateFrom, dateTo)}>Cari</Button>
            </div>
          </div>
          <div className="overflow-x-auto border-t">
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
                      <div className="text-sm font-semibold text-primary">{item.instansi}</div>
                      <div className="text-sm text-muted-foreground">{item.status_kepesertaan || "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"} • {item.tanggal_lahir || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-primary text-sm font-semibold">{item.jam_kehadiran}</div>
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
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onDelete(item.id, item.nama_lengkap)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={9} className="py-6 text-center text-muted-foreground">
                      Tidak ada data ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t p-4">
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
