import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const bookingApiSchema = z.object({
  nama_lengkap: z.string().trim().min(3),
  nomor_hp: z.string().trim().regex(/^[0-9]{10,15}$/),
  usia: z.number().int().min(1).max(120),
  alamat: z.string().trim().min(8),
  jenis_kelamin: z.enum(["L", "P"]),
  lokasi_terapi: z.string().trim().min(1),
  tanggal_terapi: z.string().regex(dateRegex),
  keluhan: z.array(z.string().trim().min(1)).min(1),
  catatan_tambahan: z.string().trim().max(500).optional(),
  paket: z.enum(["LENGKAP", "SEBAGIAN"]),
  sesi_id: z.uuid(),
});

export const quotaQuerySchema = z.object({
  tanggal: z.string().regex(dateRegex),
});

export const sesiQuerySchema = quotaQuerySchema;

export type BookingApiInput = z.infer<typeof bookingApiSchema>;
