import * as z from "zod";
import {
  INSTANSI_OPTIONS,
  STATUS_KEPESERTAAN_OPTIONS,
  isDepartemenRequiredForInstansi,
  isStatusValidForInstansi,
} from "@/lib/kepesertaan";

export const bookingFormSchema = z.object({
  namaLengkap: z.string().trim().min(3, "Nama lengkap minimal 3 karakter"),
  departemen: z.string().trim().default(""),
  instansi: z.enum(INSTANSI_OPTIONS, { message: "Pilih instansi" }),
  statusKepesertaan: z.enum(STATUS_KEPESERTAAN_OPTIONS, { message: "Pilih status kepesertaan" }),
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
  tanggalSesi: z
    .string({ message: "Pilih tanggal kehadiran" })
    .min(1, "Pilih tanggal kehadiran")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid"),
  jamSesi: z
    .string({ message: "Pilih jam kehadiran yang tersedia" })
    .min(1, "Pilih jam kehadiran yang tersedia"),
}).superRefine((val, ctx) => {
  if (isDepartemenRequiredForInstansi(val.instansi) && val.departemen.trim().length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["departemen"],
      message: "Departemen minimal 2 karakter",
    });
  }

  if (!isStatusValidForInstansi(val.instansi, val.statusKepesertaan)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["statusKepesertaan"],
      message: "Status kepesertaan tidak sesuai dengan instansi",
    });
  }

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

// `zodResolver` uses the schema's *input* type. Keep form values aligned with that type
// (not the output type after defaults are applied) to avoid TS resolver incompatibilities.
export type BookingFormValues = z.input<typeof bookingFormSchema>;
