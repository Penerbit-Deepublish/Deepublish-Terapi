import * as z from "zod";

export const bookingFormSchema = z.object({
  lokasi: z.string().min(1, "Lokasi terapi wajib diisi"),
  tanggal: z.date({
    message: "Tanggal terapi wajib dipilih",
  }),
  nama: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  noHp: z.string().min(10, "Nomor HP tidak valid").regex(/^[0-9]+$/, "Hanya angka yang diperbolehkan"),
  usia: z
    .number({ message: "Usia wajib diisi" })
    .int()
    .min(1, "Usia tidak valid")
    .max(120, "Usia tidak valid"),
  alamat: z.string().trim().min(8, "Alamat minimal 8 karakter"),
  jenisKelamin: z.enum(["L", "P"], {
    message: "Pilih jenis kelamin",
  }),
  keluhan: z.array(z.string()).min(1, "Pilih setidaknya satu keluhan"),
  keluhanTambahan: z.string().trim().max(300, "Maksimal 300 karakter").optional(),
  catatanTambahan: z.string().trim().max(500, "Maksimal 500 karakter").optional(),
  paket: z.enum(["LENGKAP", "SEBAGIAN"], {
    message: "Pilih paket terapi",
  }),
  jamSesi: z.string({
    message: "Pilih jam sesi yang tersedia",
  }).min(1, "Pilih jam sesi yang tersedia"),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
