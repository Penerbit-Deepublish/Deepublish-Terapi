import { z } from "zod";

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
  kapasitas: z.number().int().min(1).max(100),
});

export const pesertaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().optional(),
});
