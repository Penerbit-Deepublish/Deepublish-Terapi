"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type BookingFormValues, bookingFormSchema } from "@/lib/schema";
import { useBookingStore } from "@/hooks/useStore";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon, MapPin, CheckCircle2, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const KELUHAN_OPTIONS = [
  "Sakit Kepala / Migrain",
  "Nyeri Punggung",
  "Syaraf Kejepit",
  "Kelelahan / Insomnia",
  "Asam Lambung / Gerd",
  "Keseleo / Terkilir",
  "Lain-lain"
];

export function BookingForm() {
  const focusStrokeClass = "focus-visible:border-[#185cab] focus-visible:ring-[#185cab]/40";
  const {
    selectedDate,
    setSelectedDate,
    fetchQuotaForDate,
    quotaInfo,
    isLoadingQuota,
    error: quotaError,
    setError,
  } = useBookingStore();
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      lokasi: "Klinik Utama Bio Elektrik Deepublish",
      nama: "",
      noHp: "",
      usia: undefined,
      alamat: "",
      keluhan: [],
      keluhanTambahan: "",
      catatanTambahan: "",
      jenisKelamin: undefined,
      paket: "LENGKAP",
      jamSesi: "",
    },
  });
  const selectedKeluhan = useWatch({
    control: form.control,
    name: "keluhan",
  }) ?? [];

  // Watch selected date to fetch quota
  useEffect(() => {
    if (selectedDate) {
      fetchQuotaForDate(selectedDate);
      form.setValue("jamSesi", ""); // reset selected time if date changes
    }
  }, [selectedDate, fetchQuotaForDate, form]);

  const onSubmit = async (data: BookingFormValues) => {
    setSubmitError("");
    setError(null);
    const extraKeluhan = data.keluhanTambahan?.trim();
    const keluhanPayload = extraKeluhan
      ? [...data.keluhan, `Lain-lain: ${extraKeluhan}`]
      : data.keluhan;

    const payload = {
      nama_lengkap: data.nama,
      nomor_hp: data.noHp,
      usia: data.usia,
      alamat: data.alamat,
      jenis_kelamin: data.jenisKelamin,
      lokasi_terapi: data.lokasi,
      tanggal_terapi: format(data.tanggal, "yyyy-MM-dd"),
      keluhan: keluhanPayload,
      catatan_tambahan: data.catatanTambahan?.trim() || undefined,
      paket: data.paket,
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
        setSubmitError(json.message || "Gagal melakukan reservasi");
        if (selectedDate) {
          await fetchQuotaForDate(selectedDate);
        }
        return;
      }

      if (selectedDate) {
        await fetchQuotaForDate(selectedDate);
      }
      setIsSuccess(true);
    } catch {
      setSubmitError("Terjadi kesalahan jaringan");
    }
  };

  const remainingQuota = quotaInfo ? quotaInfo.maxQuota - quotaInfo.booked : null;

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
        <h2 className="text-3xl font-bold text-primary">Reservasi Berhasil!</h2>
        <p className="text-muted-foreground w-full max-w-md">
          Terima kasih {form.getValues().nama}. Silakan cek WhatsApp Anda untuk konfirmasi jadwal dan instruksi selanjutnya.
        </p>
        <Button 
          className="mt-6" 
          onClick={() => {
            setIsSuccess(false);
            form.reset();
            setSelectedDate(undefined);
            setSubmitError("");
            setError(null);
          }}
        >
          Buat Reservasi Baru
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-card rounded-3xl shadow-xl overflow-hidden border border-border">
      <div className="bg-primary/5 p-6 md:p-8 border-b border-border text-center md:text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">Form Reservasi</h2>
        <p className="text-muted-foreground">Silakan lengkapi data diri dan pilih waktu terapi Anda.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
        
        {/* Lokasi */}
        <div className="space-y-3">
          <Label>Lokasi Terapi</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input 
              {...form.register("lokasi")} 
              readOnly 
              className={cn("pl-10 bg-muted/50 font-medium", focusStrokeClass)}
            />
          </div>
        </div>

        {/* Tanggal */}
        <div className="space-y-3">
          <Label>Tanggal Terapi</Label>
          <Controller
            control={form.control}
            name="tanggal"
            render={({ field }) => (
              <div>
                 <Popover>
                  <PopoverTrigger
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-full justify-start text-left font-normal py-6 text-base",
                        focusStrokeClass,
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      {field.value ? format(field.value, "PPP", { locale: id }) : <span>Pilih tanggal terapi</span>}
                    </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(day) => {
                        field.onChange(day);
                        setSelectedDate(day);
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.tanggal && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.tanggal.message}</p>
                )}
              </div>
            )}
          />
          <AnimatePresence>
            {remainingQuota !== null && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center text-sm font-medium text-secondary-foreground bg-secondary p-3 rounded-lg border border-secondary"
              >
                <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>
                  Tersedia <strong>{remainingQuota}</strong> slot kuota pada tanggal ini
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          {quotaError && <p className="text-sm text-red-500">{quotaError}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Nama Lengkap</Label>
            <Input
              {...form.register("nama")}
              placeholder="Masukkan nama lengkap"
              className={cn("py-6", focusStrokeClass)}
            />
            {form.formState.errors.nama && (
              <p className="text-red-500 text-sm">{form.formState.errors.nama.message}</p>
            )}
          </div>
          <div className="space-y-3">
            <Label>Nomor HP / WA</Label>
            <Input
              {...form.register("noHp")}
              placeholder="Cth: 081234567890"
              type="tel"
              className={cn("py-6", focusStrokeClass)}
            />
            {form.formState.errors.noHp && (
              <p className="text-red-500 text-sm">{form.formState.errors.noHp.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Usia</Label>
            <Input
              {...form.register("usia", { valueAsNumber: true })}
              placeholder="Contoh: 35"
              type="number"
              min={1}
              max={120}
              className={cn("py-6", focusStrokeClass)}
            />
            {form.formState.errors.usia && (
              <p className="text-red-500 text-sm">{form.formState.errors.usia.message}</p>
            )}
          </div>
          <div className="space-y-3">
            <Label>Alamat Domisili</Label>
            <Input
              {...form.register("alamat")}
              placeholder="Kota / alamat singkat"
              className={cn("py-6", focusStrokeClass)}
            />
            {form.formState.errors.alamat && (
              <p className="text-red-500 text-sm">{form.formState.errors.alamat.message}</p>
            )}
          </div>
        </div>

        {/* Jenis Kelamin */}
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
                            : "border-border bg-muted text-foreground hover:bg-muted/80"
                        )}
                      >
                        {jk === "L" ? "Laki-laki" : "Perempuan"}
                      </button>
                    )
                  })}
                </div>
                {form.formState.errors.jenisKelamin && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.jenisKelamin.message}</p>
                )}
              </div>
            )}
          />
        </div>

        {/* Keluhan */}
        <div className="space-y-3">
          <Label>Keluhan yang Dirasakan (Bisa lebih dari 1)</Label>
          <Controller
            control={form.control}
            name="keluhan"
            render={({ field }) => (
              <div>
                <div className="flex flex-wrap gap-2">
                  {KELUHAN_OPTIONS.map((keluhan) => {
                    const isSelected = field.value.includes(keluhan);
                    return (
                      <button
                        key={keluhan}
                        type="button"
                        onClick={() => {
                          const val = field.value;
                          if (val.includes(keluhan)) {
                            field.onChange(val.filter((k) => k !== keluhan));
                          } else {
                            field.onChange([...val, keluhan]);
                          }
                        }}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                          focusStrokeClass,
                          isSelected 
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105" 
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {keluhan}
                      </button>
                    );
                  })}
                </div>
                {form.formState.errors.keluhan && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.keluhan.message}</p>
                )}
              </div>
            )}
          />
        </div>

        {selectedKeluhan.includes("Lain-lain") && (
          <div className="space-y-3">
            <Label>Detail Keluhan Lainnya</Label>
            <textarea
              {...form.register("keluhanTambahan")}
              rows={3}
              placeholder="Jelaskan keluhan secara singkat"
              className={cn(
                "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px]",
                focusStrokeClass,
              )}
            />
            {form.formState.errors.keluhanTambahan && (
              <p className="text-red-500 text-sm">{form.formState.errors.keluhanTambahan.message}</p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Label>Catatan Tambahan (Opsional)</Label>
          <textarea
            {...form.register("catatanTambahan")}
            rows={3}
            placeholder="Contoh: Riwayat sakit, obat rutin, atau preferensi komunikasi"
            className={cn(
              "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px]",
              focusStrokeClass,
            )}
          />
          {form.formState.errors.catatanTambahan && (
            <p className="text-red-500 text-sm">{form.formState.errors.catatanTambahan.message}</p>
          )}
        </div>

        {/* Paket Terapi */}
         <div className="space-y-3">
          <Label>Pilihan Paket Terapi</Label>
          <Controller
            control={form.control}
            name="paket"
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: "LENGKAP", title: "Paket Lengkap", desc: "Seluruh badan (± 60 menit)" },
                  { id: "SEBAGIAN", title: "Paket Sebagian", desc: "Area tertentu (± 30 menit)" }
                ].map((paket) => {
                  const isSelected = field.value === paket.id;
                  return (
                    <button
                      key={paket.id}
                      type="button"
                      onClick={() => field.onChange(paket.id)}
                      className={cn(
                        "relative flex flex-col items-start p-6 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden",
                        focusStrokeClass,
                        isSelected ? "border-secondary" : "border-transparent bg-muted/50 hover:bg-muted"
                      )}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="paketHighlight"
                          className="absolute inset-0 bg-secondary"
                          initial={false}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className={cn("relative z-10 font-bold text-lg", isSelected ? "text-secondary-foreground" : "text-foreground")}>
                        {paket.title}
                      </span>
                      <span className="relative z-10 text-sm text-muted-foreground mt-1">{paket.desc}</span>
                    </button>
                  )
                })}
              </div>
            )}
          />
        </div>

        {/* Waktu Sesi */}
        <div className="space-y-3">
          <Label>Pilih Jam Sesi</Label>
          {selectedDate ? (
            <Controller
              control={form.control}
              name="jamSesi"
              render={({ field }) => (
                 <div>
                    {isLoadingQuota ? (
                      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                        Memuat pilihan sesi...
                      </div>
                    ) : quotaInfo && quotaInfo.slots.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {quotaInfo.slots.map((slot) => {
                          const isSelected = field.value === slot.id;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => field.onChange(slot.id)}
                              className={cn(
                                "py-3 px-4 rounded-xl font-medium transition-all duration-300 text-center border-2",
                                focusStrokeClass,
                                !slot.available
                                  ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-transparent"
                                  : isSelected
                                    ? "border-[#185cab] bg-[#185cab]/10 text-[#185cab]"
                                    : "border-transparent bg-muted/30 hover:bg-muted text-foreground"
                              )}
                            >
                              {slot.time}
                              {!slot.available && (
                                <span className="block text-xs mt-1 text-destructive font-semibold">Penuh</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                        Sesi belum tersedia untuk tanggal ini.
                      </div>
                    )}
                    {form.formState.errors.jamSesi && (
                      <p className="text-red-500 text-sm mt-2">{form.formState.errors.jamSesi.message}</p>
                    )}
                 </div>
              )}
            />
          ) : (
            <div className="p-4 bg-muted/50 rounded-xl text-center text-muted-foreground text-sm border-dashed border-2 border-border">
              Silakan pilih tanggal terapi terlebih dahulu untuk melihat jam yang tersedia.
            </div>
          )}
        </div>

        {/* Sticky Submit Button Wrapper for better UX on Mobile */}
        <div className="pt-4 sticky bottom-6 z-20">
          <Button 
            type="submit" 
            className="w-full py-6 text-lg rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98]"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Memproses Reservasi...
              </>
            ) : (
              "Konfirmasi Reservasi"
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
