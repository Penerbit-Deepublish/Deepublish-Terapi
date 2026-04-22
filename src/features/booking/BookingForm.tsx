"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { type BookingFormValues, bookingFormSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_KEPESERTAAN_OPTIONS } from "@/lib/kepesertaan";

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

const JAM_KEHADIRAN_OPTIONS = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
] as const;

type ApiSesiItem = {
  id: string;
  jam: string;
  kapasitas: number;
  terisi: number;
  terisi_laki: number;
  terisi_wanita: number;
  sisa_laki: number;
  sisa_wanita: number;
  tersedia: boolean;
};

type ApiTanggalItem = {
  tanggal: string;
  kuota_max: number;
  kuota_terpakai: number;
  sisa: number;
};

function normalizeJam(value: string) {
  return value.replaceAll(".", ":").replace(/\s*-\s*/g, " - ").trim();
}

function displayJam(value: string) {
  return normalizeJam(value).replaceAll(":", ".");
}

function toggleValue(list: string[], value: string, checked: boolean) {
  const next = new Set(list);
  if (checked) next.add(value);
  else next.delete(value);
  return Array.from(next);
}

export function BookingForm() {
  const focusStrokeClass = "focus-visible:border-[#185cab] focus-visible:ring-[#185cab]/40";
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [availableDates, setAvailableDates] = useState<ApiTanggalItem[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [datesError, setDatesError] = useState("");
  const [sessions, setSessions] = useState<ApiSesiItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      namaLengkap: "",
      departemen: "",
      statusKepesertaan: undefined,
      tanggalLahir: undefined,
      jenisKelamin: undefined,
      paket: "LENGKAP",
      keluhanLuar: [],
      keluhanLuarLainnya: "",
      keluhanDalam: [],
      keluhanDalamLainnya: "",
      tanggalSesi: "",
      jamSesi: "",
    },
  });

  const selectedKeluhanLuar =
    useWatch({ control: form.control, name: "keluhanLuar" }) ?? [];
  const selectedKeluhanDalam =
    useWatch({ control: form.control, name: "keluhanDalam" }) ?? [];
  const selectedTanggalSesi =
    useWatch({ control: form.control, name: "tanggalSesi" }) ?? "";
  const selectedJenisKelamin =
    useWatch({ control: form.control, name: "jenisKelamin" }) ?? undefined;
  const tersediaTanggal = availableDates.filter((item) => item.sisa > 0);
  const isAllQuotaFull = availableDates.length > 0 && tersediaTanggal.length === 0;
  const isReservationDisabled = isAllQuotaFull;

  const loadDates = useCallback(async () => {
    setIsLoadingDates(true);
    setDatesError("");
    try {
      const res = await fetch("/api/terapi/tanggal");
      const json = await res.json();
      if (!res.ok || !json.success) {
        setDatesError(json.message || "Gagal memuat tanggal jadwal");
        setAvailableDates([]);
        return;
      }
      setAvailableDates(json.data as ApiTanggalItem[]);
    } catch {
      setDatesError("Terjadi kesalahan jaringan");
      setAvailableDates([]);
    } finally {
      setIsLoadingDates(false);
    }
  }, []);

  useEffect(() => {
    void loadDates();
  }, [loadDates]);

  useEffect(() => {
    if (!selectedTanggalSesi) {
      setSessions([]);
      setSessionsError("");
      form.setValue("jamSesi", "");
      return;
    }

    const load = async () => {
      setIsLoadingSessions(true);
      setSessionsError("");
      form.setValue("jamSesi", "");
      try {
        const params = new URLSearchParams({ tanggal: selectedTanggalSesi });
        if (selectedJenisKelamin) {
          params.set("jenis_kelamin", selectedJenisKelamin);
        }
        const res = await fetch(`/api/terapi/sesi?${params.toString()}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          setSessionsError(json.message || "Gagal memuat jam kehadiran");
          setSessions([]);
          return;
        }
        const nextSessions = json.data as ApiSesiItem[];
        setSessions(nextSessions);
        const firstAvailable = nextSessions.find((item) => item.tersedia);
        if (firstAvailable) {
          form.setValue("jamSesi", firstAvailable.id, { shouldValidate: true });
        }
      } catch {
        setSessionsError("Terjadi kesalahan jaringan");
        setSessions([]);
      } finally {
        setIsLoadingSessions(false);
      }
    };

    void load();
  }, [selectedTanggalSesi, selectedJenisKelamin, form]);

  const onSubmit = async (data: BookingFormValues) => {
    setSubmitError("");

    const keluhanLuar = (data.keluhanLuar ?? []).filter((k) => k !== OTHER_OPTION);
    const keluhanDalam = (data.keluhanDalam ?? []).filter((k) => k !== OTHER_OPTION);
    const keluhanLuarLainnya = selectedKeluhanLuar.includes(OTHER_OPTION)
      ? data.keluhanLuarLainnya?.trim() || undefined
      : undefined;
    const keluhanDalamLainnya = selectedKeluhanDalam.includes(OTHER_OPTION)
      ? data.keluhanDalamLainnya?.trim() || undefined
      : undefined;

    const payload = {
      nama_lengkap: data.namaLengkap,
      departemen: data.departemen,
      status_kepesertaan: data.statusKepesertaan,
      tanggal_terapi: data.tanggalSesi,
      tanggal_lahir: format(data.tanggalLahir, "yyyy-MM-dd"),
      jenis_kelamin: data.jenisKelamin,
      paket: data.paket,
      keluhan_luar: keluhanLuar,
      keluhan_luar_lainnya: keluhanLuarLainnya,
      keluhan_dalam: keluhanDalam,
      keluhan_dalam_lainnya: keluhanDalamLainnya,
      sesi_id: data.jamSesi,
    };

    try {
      const res = await fetch("/api/terapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setSubmitError(json.message || "Gagal melakukan pendaftaran");
        return;
      }
      setAvailableDates((prev) =>
        prev
          .map((item) => {
            if (item.tanggal !== data.tanggalSesi) return item;
            const kuotaTerpakai = item.kuota_terpakai + 1;
            const sisa = Math.max(0, item.kuota_max - kuotaTerpakai);
            return {
              ...item,
              kuota_terpakai: kuotaTerpakai,
              sisa,
            };
          }),
      );
      setIsSuccess(true);
    } catch {
      setSubmitError("Terjadi kesalahan jaringan");
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        >
          <CheckCircle2 className="w-24 h-24 text-secondary mx-auto" />
        </motion.div>
        <h2 className="text-3xl font-bold text-primary">Pendaftaran Berhasil!</h2>
        <p className="text-muted-foreground w-full max-w-md">
          Terima kasih {form.getValues().namaLengkap}. Data Anda sudah kami terima.
        </p>
        <Button
          className="mt-6"
          onClick={async () => {
            setIsSuccess(false);
            form.reset();
            setSubmitError("");
            await loadDates();
          }}
        >
          Buat Pendaftaran Baru
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto bg-card rounded-3xl shadow-xl overflow-hidden border border-border">
      {isReservationDisabled && (
        <>
          <div className="pointer-events-none absolute inset-0 z-20 bg-slate-100/55 backdrop-blur-[1px]" />
          <div className="pointer-events-none absolute -left-20 top-10 z-30 w-[150%] -rotate-12 bg-[#d62828] py-2 text-center text-sm font-extrabold tracking-[0.2em] text-white shadow-lg">
            KUOTA PENUH
          </div>
        </>
      )}
      <div className="bg-primary/5 p-6 md:p-8 border-b border-border text-center md:text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
          Form Pendaftaran Terapi Deepublish
        </h2>
        <p className="text-muted-foreground">Silakan lengkapi data di bawah ini.</p>
      </div>

      {isReservationDisabled && (
        <p className="mx-6 mt-6 rounded-xl border border-[#d62828]/30 bg-[#fff1f1] px-4 py-3 text-sm font-semibold text-[#b42318] md:mx-8">
          Seluruh kuota pada tanggal yang tersedia sudah penuh. Form reservasi dinonaktifkan sementara.
        </p>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-7">
        <fieldset
          disabled={isReservationDisabled}
          className={cn("space-y-6 md:space-y-7", isReservationDisabled && "pointer-events-none opacity-80")}
        >
        <div className="space-y-3">
          <Label>Nama Lengkap</Label>
          <Input
            {...form.register("namaLengkap")}
            placeholder="Masukkan nama lengkap"
            className={cn("py-6", focusStrokeClass)}
          />
          {form.formState.errors.namaLengkap && (
            <p className="text-red-500 text-sm">{form.formState.errors.namaLengkap.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Departemen</Label>
          <Input
            {...form.register("departemen")}
            placeholder="Masukkan departemen"
            className={cn("py-6", focusStrokeClass)}
          />
          {form.formState.errors.departemen && (
            <p className="text-red-500 text-sm">{form.formState.errors.departemen.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Status Kepesertaan</Label>
          <Controller
            control={form.control}
            name="statusKepesertaan"
            render={({ field }) => (
              <div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {STATUS_KEPESERTAAN_OPTIONS.map((opt) => {
                    const isSelected = field.value === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => field.onChange(opt)}
                        className={cn(
                          "min-h-14 rounded-2xl border-2 px-4 py-3 text-center font-semibold transition-all duration-300",
                          focusStrokeClass,
                          isSelected
                            ? "border-[#185cab] bg-[#185cab] text-white"
                            : "border-border bg-muted text-foreground hover:bg-muted/80",
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {form.formState.errors.statusKepesertaan && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.statusKepesertaan.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        <div className="space-y-3">
          <Label>Tanggal Lahir</Label>
          <Input
            type="date"
            {...form.register("tanggalLahir", { valueAsDate: true })}
            className={cn("py-6", focusStrokeClass)}
          />
          {form.formState.errors.tanggalLahir && (
            <p className="text-red-500 text-sm">{form.formState.errors.tanggalLahir.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Jenis Kelamin</Label>
          <Controller
            control={form.control}
            name="jenisKelamin"
            render={({ field }) => (
              <div>
                <div className="flex gap-4">
                  {(["L", "P"] as const).map((jk) => {
                    const isSelected = field.value === jk;
                    return (
                      <button
                        key={jk}
                        type="button"
                        onClick={() => field.onChange(jk)}
                        className={cn(
                          "flex-1 py-4 px-6 rounded-2xl border-2 transition-all duration-300 font-semibold",
                          focusStrokeClass,
                          isSelected
                            ? "border-[#185cab] bg-[#185cab] text-white"
                            : "border-border bg-muted text-foreground hover:bg-muted/80",
                        )}
                      >
                        {jk === "L" ? "Laki-laki" : "Perempuan"}
                      </button>
                    );
                  })}
                </div>
                {form.formState.errors.jenisKelamin && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.jenisKelamin.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        <div className="space-y-3">
          <Label>Pilihan Paket</Label>
          <Controller
            control={form.control}
            name="paket"
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: "LENGKAP", title: "Lengkap", desc: "Seluruh badan (± 60 menit)" },
                  { id: "SEBAGIAN", title: "Partial", desc: "Area tertentu (± 30 menit)" },
                ].map((paket) => {
                  const isSelected = field.value === paket.id;
                  return (
                    <button
                      key={paket.id}
                      type="button"
                      onClick={() => field.onChange(paket.id as BookingFormValues["paket"])}
                      className={cn(
                        "relative flex flex-col items-start p-6 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden",
                        focusStrokeClass,
                        isSelected
                          ? "border-secondary bg-secondary text-secondary-foreground"
                          : "border-transparent bg-muted/50 hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "relative z-10 font-bold text-lg",
                          isSelected ? "text-secondary-foreground" : "text-foreground",
                        )}
                      >
                        {paket.title}
                      </span>
                      <span
                        className={cn(
                          "relative z-10 text-sm mt-1",
                          isSelected ? "text-secondary-foreground/90" : "text-muted-foreground",
                        )}
                      >
                        {paket.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>

        <div className="space-y-3">
          <Label>Keluhan Luar</Label>
          <Controller
            control={form.control}
            name="keluhanLuar"
            render={({ field }) => (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(KELUHAN_LUAR_OPTIONS as readonly string[]).map((opt) => (
                    <label
                      key={opt}
                      className={cn(
                        "h-full flex items-start gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 transition-colors",
                        "hover:bg-muted/30",
                      )}
                    >
                      <input
                        type="checkbox"
                        className={cn("mt-0.5 h-4 w-4 rounded border-border accent-[#185cab]", focusStrokeClass)}
                        checked={(field.value ?? []).includes(opt)}
                        onChange={(e) => field.onChange(toggleValue(field.value ?? [], opt, e.target.checked))}
                      />
                      <span className="text-sm leading-6">{opt}</span>
                    </label>
                  ))}
                </div>
                {form.formState.errors.keluhanLuar && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.keluhanLuar.message as string}
                  </p>
                )}
              </div>
            )}
          />
          {selectedKeluhanLuar.includes(OTHER_OPTION) && (
            <div className="space-y-3">
              <Label>Yang lain (Keluhan Luar)</Label>
              <Input
                {...form.register("keluhanLuarLainnya")}
                placeholder="Tuliskan keluhan lainnya"
                className={cn("py-6", focusStrokeClass)}
              />
              {form.formState.errors.keluhanLuarLainnya && (
                <p className="text-red-500 text-sm">{form.formState.errors.keluhanLuarLainnya.message}</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label>Keluhan Dalam</Label>
          <Controller
            control={form.control}
            name="keluhanDalam"
            render={({ field }) => (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(KELUHAN_DALAM_OPTIONS as readonly string[]).map((opt) => (
                    <label
                      key={opt}
                      className={cn(
                        "h-full flex items-start gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 transition-colors",
                        "hover:bg-muted/30",
                      )}
                    >
                      <input
                        type="checkbox"
                        className={cn("mt-0.5 h-4 w-4 rounded border-border accent-[#185cab]", focusStrokeClass)}
                        checked={(field.value ?? []).includes(opt)}
                        onChange={(e) => field.onChange(toggleValue(field.value ?? [], opt, e.target.checked))}
                      />
                      <span className="text-sm leading-6">{opt}</span>
                    </label>
                  ))}
                </div>
                {form.formState.errors.keluhanDalam && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.keluhanDalam.message as string}
                  </p>
                )}
              </div>
            )}
          />
          {selectedKeluhanDalam.includes(OTHER_OPTION) && (
            <div className="space-y-3">
              <Label>Yang lain (Keluhan Dalam)</Label>
              <Input
                {...form.register("keluhanDalamLainnya")}
                placeholder="Tuliskan keluhan lainnya"
                className={cn("py-6", focusStrokeClass)}
              />
              {form.formState.errors.keluhanDalamLainnya && (
                <p className="text-red-500 text-sm">{form.formState.errors.keluhanDalamLainnya.message}</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label>Pilih Tanggal Kehadiran</Label>
          <Controller
            control={form.control}
            name="tanggalSesi"
            render={({ field }) => (
              <div className="rounded-2xl border border-[#185cab]/20 bg-gradient-to-br from-[#185cab]/10 via-white to-[#3ab5ad]/10 p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2 text-[#185cab]">
                  <CalendarDays className="h-4 w-4" />
                  <p className="text-sm font-semibold">Jadwal Tanggal Aktif</p>
                </div>
                {isLoadingDates ? (
                  <p className="text-sm text-muted-foreground">Memuat tanggal jadwal...</p>
                ) : availableDates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Belum ada jadwal aktif dari admin. Silakan pilih tanggal lain nanti.
                  </p>
                ) : tersediaTanggal.length === 0 ? (
                  <p className="text-sm font-semibold text-amber-700">
                    Semua kuota pada tanggal aktif sudah penuh.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger
                        size="default"
                        className={cn(
                          "h-12 w-full rounded-xl border-[#185cab]/20 bg-white/90 px-4 text-sm font-medium shadow-sm",
                          focusStrokeClass,
                        )}
                      >
                        <SelectValue placeholder="Pilih tanggal kehadiran" />
                      </SelectTrigger>
                      <SelectContent
                        align="start"
                        sideOffset={8}
                        className="w-[var(--anchor-width)] max-h-72 rounded-xl border border-[#185cab]/20 p-1 shadow-lg"
                      >
                        <SelectGroup>
                          {availableDates.map((item) => (
                            <SelectItem
                              key={item.tanggal}
                              value={item.tanggal}
                              disabled={item.sisa <= 0}
                              className="rounded-lg px-3 py-2.5 data-[highlighted]:bg-[#185cab]/10"
                            >
                              <span className="flex flex-col items-start gap-0.5 pr-6">
                                <span className="font-medium text-foreground">{item.tanggal}</span>
                                <span className={cn("text-[11px] font-semibold", item.sisa > 0 ? "text-[#185cab]" : "text-red-500")}>
                                  {item.sisa > 0 ? `Sisa kuota ${item.sisa}` : "Kuota penuh"}
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {/*
                      Custom select keeps interaction consistent across browsers,
                      while still storing the same tanggal value in form state.
                    */}
                    <p className="text-xs text-muted-foreground">
                      Hanya tanggal yang dibuka admin yang bisa dipilih.
                    </p>
                  </div>
                )}
              </div>
            )}
          />
          {datesError && <p className="text-red-500 text-sm">{datesError}</p>}
          {form.formState.errors.tanggalSesi && (
            <p className="text-red-500 text-sm">{form.formState.errors.tanggalSesi.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Jam Kehadiran</Label>
          <Controller
            control={form.control}
            name="jamSesi"
            render={({ field }) => (
              <div>
                {isLoadingSessions ? (
                  <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                    Memuat pilihan jam...
                  </div>
                ) : !selectedTanggalSesi ? (
                  <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                    Pilih tanggal terlebih dahulu untuk menampilkan jam yang tersedia.
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                    Tidak ada jam tersedia untuk tanggal ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(() => {
                      const sessionByJam = new Map(
                        sessions.map((item) => [normalizeJam(item.jam), item] as const),
                      );
                      return JAM_KEHADIRAN_OPTIONS.map((jam) => {
                        const slot = sessionByJam.get(normalizeJam(jam));
                        const slotId = slot?.id ?? "";
                        const isConfigured = Boolean(slotId);
                        const isFull = isConfigured && !slot?.tersedia;
                        const isDisabled = !isConfigured || isFull;
                        const isSelected = field.value === slotId;
                        return (
                          <button
                            key={jam}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              if (!slotId || isDisabled) return;
                              field.onChange(slotId);
                            }}
                            className={cn(
                              "py-3 px-4 rounded-xl font-medium transition-all duration-300 text-center border-2",
                              focusStrokeClass,
                              !isConfigured
                                ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-transparent"
                                : isFull
                                  ? "opacity-70 cursor-not-allowed bg-muted text-muted-foreground border-transparent"
                                : isSelected
                                  ? "border-[#185cab] bg-[#185cab] text-white shadow-sm shadow-[#185cab]/40"
                                  : "border-transparent bg-muted/30 hover:bg-muted text-foreground",
                            )}
                          >
                            {displayJam(jam)}
                            {!isConfigured && (
                              <span className="block text-xs mt-1 text-destructive font-semibold">
                                Belum tersedia
                              </span>
                            )}
                            {isFull && (
                              <span
                                className={cn(
                                  "block text-xs mt-1 font-semibold",
                                  isSelected ? "text-amber-200" : "text-amber-600",
                                )}
                              >
                                Penuh
                              </span>
                            )}
                            {isConfigured && (
                              <span
                                className={cn(
                                  "block text-[11px] mt-1 font-medium",
                                  isSelected ? "text-white/90" : "text-[#185cab]",
                                )}
                              >
                                Sisa Laki-laki: {slot?.sisa_laki ?? 0} • Sisa Perempuan: {slot?.sisa_wanita ?? 0}
                              </span>
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                )}

                {sessionsError && <p className="text-sm text-red-500 mt-2">{sessionsError}</p>}
                {form.formState.errors.jamSesi && (
                  <p className="text-red-500 text-sm mt-2">{form.formState.errors.jamSesi.message}</p>
                )}
              </div>
            )}
          />
        </div>

        <div className="pt-4 sticky bottom-6 z-20">
          <Button
            type="submit"
            className="w-full py-6 text-lg rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98]"
            disabled={form.formState.isSubmitting || isReservationDisabled}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Memproses Pendaftaran...
              </>
            ) : (
              "Kirim"
            )}
          </Button>
          {submitError && (
            <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{submitError}</p>
          )}
        </div>
        </fieldset>
      </form>
    </div>
  );
}
