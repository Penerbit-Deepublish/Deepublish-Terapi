import * as z from "zod";

export const bookingFormSchema = z.object({
  namaLengkap: z.string().trim().min(3, "Nama lengkap minimal 3 karakter"),
  departemen: z.string().trim().min(2, "Departemen minimal 2 karakter"),
  statusKepesertaan: z.enum(["KARYAWAN", "KELUARGA"], { message: "Pilih status kepesertaan" }),
  tanggalLahir: z.date({ message: "Tanggal lahir wajib dipilih" }),
  jenisKelamin: z.enum(["L", "P"], {
    message: "Pilih jenis kelamin",
  }),
  paket: z.enum(["LENGKAP", "SEBAGIAN"], {
    message: "Pilih paket terapi",
  }),
  keluhanLuar: z.array(z.string()).default([]),
  keluhanLuarLainnya: z.string().trim().max(200, "Maksimal 200 karakter").optional(),
  keluhanDalam: z.array(z.string()).default([]),
  keluhanDalamLainnya: z.string().trim().max(200, "Maksimal 200 karakter").optional(),
  jamSesi: z
    .string({ message: "Pilih jam kehadiran yang tersedia" })
    .min(1, "Pilih jam kehadiran yang tersedia"),
}).superRefine((val, ctx) => {
  const hasKeluhan =
    (val.keluhanLuar?.length ?? 0) > 0 ||
    (val.keluhanDalam?.length ?? 0) > 0 ||
    Boolean(val.keluhanLuarLainnya?.trim()) ||
    Boolean(val.keluhanDalamLainnya?.trim());
  if (!hasKeluhan) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["keluhanLuar"],
      message: "Pilih setidaknya satu keluhan (luar/dalam) atau isi yang lain.",
    });
  }

  if (val.keluhanLuar?.includes("Yang lain") && !val.keluhanLuarLainnya?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["keluhanLuarLainnya"],
      message: "Mohon isi detail untuk pilihan 'Yang lain' (keluhan luar).",
    });
  }
  if (val.keluhanDalam?.includes("Yang lain") && !val.keluhanDalamLainnya?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["keluhanDalamLainnya"],
      message: "Mohon isi detail untuk pilihan 'Yang lain' (keluhan dalam).",
    });
  }
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
