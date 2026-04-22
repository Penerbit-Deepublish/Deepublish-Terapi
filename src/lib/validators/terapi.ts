import { z } from "zod";
import { STATUS_KEPESERTAAN_OPTIONS } from "@/lib/kepesertaan";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const bookingApiSchema = z.object({
  nama_lengkap: z.string().trim().min(3),
  departemen: z.string().trim().min(1),
  status_kepesertaan: z.enum(STATUS_KEPESERTAAN_OPTIONS),
  tanggal_terapi: z.string().regex(dateRegex),
  tanggal_lahir: z.string().regex(dateRegex),
  jenis_kelamin: z.enum(["L", "P"]),
  lokasi_terapi: z.string().trim().min(1).optional(),
  paket: z.enum(["LENGKAP", "SEBAGIAN"]),
  keluhan_luar: z.array(z.string().trim().min(1)).default([]),
  keluhan_luar_lainnya: z.string().trim().max(200).optional(),
  keluhan_dalam: z.array(z.string().trim().min(1)).default([]),
  keluhan_dalam_lainnya: z.string().trim().max(200).optional(),
  sesi_id: z.uuid(),
}).superRefine((val, ctx) => {
  const hasKeluhan =
    (val.keluhan_luar?.length ?? 0) > 0 ||
    (val.keluhan_dalam?.length ?? 0) > 0 ||
    Boolean(val.keluhan_luar_lainnya?.trim()) ||
    Boolean(val.keluhan_dalam_lainnya?.trim());
  if (!hasKeluhan) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pilih setidaknya satu keluhan (luar/dalam) atau isi yang lain.",
      path: ["keluhan_luar"],
    });
  }

  if (val.keluhan_luar?.includes("Yang lain") && !val.keluhan_luar_lainnya?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Mohon isi detail untuk pilihan 'Yang lain' (keluhan luar).",
      path: ["keluhan_luar_lainnya"],
    });
  }
  if (val.keluhan_dalam?.includes("Yang lain") && !val.keluhan_dalam_lainnya?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Mohon isi detail untuk pilihan 'Yang lain' (keluhan dalam).",
      path: ["keluhan_dalam_lainnya"],
    });
  }
});

export const quotaQuerySchema = z.object({
  tanggal: z.string().regex(dateRegex),
});

export const sesiQuerySchema = quotaQuerySchema.extend({
  jenis_kelamin: z.enum(["L", "P"]).optional(),
});

export type BookingApiInput = z.infer<typeof bookingApiSchema>;
