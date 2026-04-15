"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { type BookingFormValues, bookingFormSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const OTHER_OPTION = "Yang lain";

const KELUHAN_LUAR_OPTIONS = [
  "Stroke",
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

type ApiSesiItem = {
  id: string;
  jam: string;
  kapasitas: number;
  terisi: number;
  tersedia: boolean;
};

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
  const [sessions, setSessions] = useState<ApiSesiItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState("");

  const defaultTanggal = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

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
      jamSesi: "",
    },
  });

  const selectedKeluhanLuar =
    useWatch({ control: form.control, name: "keluhanLuar" }) ?? [];
  const selectedKeluhanDalam =
    useWatch({ control: form.control, name: "keluhanDalam" }) ?? [];

  useEffect(() => {
    const load = async () => {
      setIsLoadingSessions(true);
      setSessionsError("");
      try {
        const res = await fetch(`/api/terapi/sesi?tanggal=${encodeURIComponent(defaultTanggal)}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          setSessionsError(json.message || "Gagal memuat jam kehadiran");
          setSessions([]);
          return;
        }
        setSessions(json.data as ApiSesiItem[]);
      } catch {
        setSessionsError("Terjadi kesalahan jaringan");
        setSessions([]);
      } finally {
        setIsLoadingSessions(false);
      }
    };

    void load();
  }, [defaultTanggal]);

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
          onClick={() => {
            setIsSuccess(false);
            form.reset();
            setSubmitError("");
          }}
        >
          Buat Pendaftaran Baru
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-card rounded-3xl shadow-xl overflow-hidden border border-border">
      <div className="bg-primary/5 p-6 md:p-8 border-b border-border text-center md:text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
          Form Pendaftaran Terapi Deepublish
        </h2>
        <p className="text-muted-foreground">Silakan lengkapi data di bawah ini.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
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
                <div className="flex gap-4">
                  {([
                    { id: "KARYAWAN", label: "Karyawan" },
                    { id: "KELUARGA", label: "Keluarga" },
                  ] as const).map((opt) => {
                    const isSelected = field.value === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => field.onChange(opt.id)}
                        className={cn(
                          "flex-1 py-4 px-6 rounded-2xl border-2 transition-all duration-300 font-semibold",
                          focusStrokeClass,
                          isSelected
                            ? "border-[#185cab] bg-[#185cab] text-white"
                            : "border-border bg-muted text-foreground hover:bg-muted/80",
                        )}
                      >
                        {opt.label}
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
                        isSelected ? "border-secondary" : "border-transparent bg-muted/50 hover:bg-muted",
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
                      <span className="relative z-10 text-sm text-muted-foreground mt-1">{paket.desc}</span>
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
              <div className="space-y-2">
                {(KELUHAN_LUAR_OPTIONS as readonly string[]).map((opt) => (
                  <label
                    key={opt}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 transition-colors",
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
                {form.formState.errors.keluhanLuar && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.keluhanLuar.message as string}
                  </p>
                )}
              </div>
            )}
          />
          {selectedKeluhanLuar.includes(OTHER_OPTION) && (
            <div className="space-y-2">
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
              <div className="space-y-2">
                {(KELUHAN_DALAM_OPTIONS as readonly string[]).map((opt) => (
                  <label
                    key={opt}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 transition-colors",
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
                {form.formState.errors.keluhanDalam && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.keluhanDalam.message as string}
                  </p>
                )}
              </div>
            )}
          />
          {selectedKeluhanDalam.includes(OTHER_OPTION) && (
            <div className="space-y-2">
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
                ) : sessions.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {sessions.map((slot) => {
                      const isSelected = field.value === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={!slot.tersedia}
                          onClick={() => field.onChange(slot.id)}
                          className={cn(
                            "py-3 px-4 rounded-xl font-medium transition-all duration-300 text-center border-2",
                            focusStrokeClass,
                            !slot.tersedia
                              ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-transparent"
                              : isSelected
                                ? "border-[#185cab] bg-[#185cab]/10 text-[#185cab]"
                                : "border-transparent bg-muted/30 hover:bg-muted text-foreground",
                          )}
                        >
                          {slot.jam}
                          {!slot.tersedia && (
                            <span className="block text-xs mt-1 text-destructive font-semibold">Penuh</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                    Jam kehadiran belum tersedia.
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
            disabled={form.formState.isSubmitting}
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
      </form>
    </div>
  );
}

