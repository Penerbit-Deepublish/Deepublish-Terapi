import { z } from "zod";
import { STATUS_KEPESERTAAN_OPTIONS } from "@/lib/kepesertaan";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const setKuotaSchema = z
  .object({
    tanggal: z.string().regex(dateRegex).optional(),
    tanggal_mulai: z.string().regex(dateRegex).optional(),
    tanggal_selesai: z.string().regex(dateRegex).optional(),
    kuota_max: z.number().int().min(1).max(500),
  })
  .superRefine((value, ctx) => {
    const hasSingle = Boolean(value.tanggal);
    const hasRange = Boolean(value.tanggal_mulai && value.tanggal_selesai);
    if (!hasSingle && !hasRange) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use `tanggal` or (`tanggal_mulai` + `tanggal_selesai`).",
      });
    }
  });

export const setSesiSchema = z.object({
  id: z.uuid().optional(),
  jam: z.string().trim().min(3),
  kapasitas: z.number().int().min(1).max(4),
});

export const pesertaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(15),
  q: z.string().optional(),
  from: z.string().regex(dateRegex).optional(),
  to: z.string().regex(dateRegex).optional(),
}).superRefine((value, ctx) => {
  if (value.from && value.to && value.to < value.from) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["to"],
      message: "Tanggal selesai tidak boleh lebih kecil dari tanggal mulai",
    });
  }
});

export const updatePesertaSchema = z.object({
  nama_lengkap: z.string().trim().min(3),
  departemen: z.string().trim().min(1),
  status_kepesertaan: z.enum(STATUS_KEPESERTAAN_OPTIONS),
  tanggal_terapi: z.string().regex(dateRegex),
  tanggal_lahir: z.string().regex(dateRegex),
  jenis_kelamin: z.enum(["L", "P"]),
  paket: z.enum(["LENGKAP", "SEBAGIAN"]),
  keluhan_luar: z.array(z.string().trim().min(1)).default([]),
  keluhan_luar_lainnya: z.string().trim().max(200).optional(),
  keluhan_dalam: z.array(z.string().trim().min(1)).default([]),
  keluhan_dalam_lainnya: z.string().trim().max(200).optional(),
  sesi_id: z.string().trim().min(1),
}).superRefine((val, ctx) => {
  const hasKeluhan =
    (val.keluhan_luar?.length ?? 0) > 0 ||
    (val.keluhan_dalam?.length ?? 0) > 0 ||
    Boolean(val.keluhan_luar_lainnya?.trim()) ||
    Boolean(val.keluhan_dalam_lainnya?.trim());
  if (!hasKeluhan) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pilih minimal satu keluhan atau isi yang lain.",
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

export const adminDateRangeQuerySchema = z.object({
  from: z.string().regex(dateRegex).optional(),
  to: z.string().regex(dateRegex).optional(),
}).superRefine((value, ctx) => {
  if (value.from && value.to && value.to < value.from) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["to"],
      message: "Tanggal selesai tidak boleh lebih kecil dari tanggal mulai",
    });
  }
});

export const deleteKuotaQuerySchema = z.object({
  tanggal: z.string().regex(dateRegex),
});

export const penggunaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(15),
  q: z.string().trim().optional(),
  from: z.string().regex(dateRegex).optional(),
  to: z.string().regex(dateRegex).optional(),
}).superRefine((value, ctx) => {
  if (value.from && value.to && value.to < value.from) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["to"],
      message: "Tanggal selesai tidak boleh lebih kecil dari tanggal mulai",
    });
  }
});

export const createPenggunaSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});

export const updatePenggunaSchema = z
  .object({
    email: z.string().trim().email().optional(),
    password: z.string().min(8).max(72).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Isi minimal email atau password",
      });
    }
  });

export const adminProfileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  avatar: z.string().trim().url(),
});

export const adminPasswordChangeSchema = z
  .object({
    current_password: z.string().min(1),
    new_password: z.string().min(8).max(72),
    confirm_password: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    if (value.new_password !== value.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm_password"],
        message: "Konfirmasi password tidak cocok",
      });
    }
    if (value.current_password === value.new_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["new_password"],
        message: "Password baru harus berbeda dari password saat ini",
      });
    }
  });
