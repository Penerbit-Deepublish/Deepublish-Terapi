export const STATUS_KEPESERTAAN_OPTIONS = [
  "Siswa",
  "Keluarga Siswa",
  "Yayasan",
  "Keluarga Yayasan",
  "Pamong",
  "Keluarga Pamong",
  "Guru",
  "Keluarga Guru",
  "Masyarakat Sekitar",
  "Jamaah Masjid",
] as const;

export type StatusKepesertaan = (typeof STATUS_KEPESERTAAN_OPTIONS)[number];

export function isStatusKepesertaan(value: unknown): value is StatusKepesertaan {
  if (typeof value !== "string") return false;
  return STATUS_KEPESERTAAN_OPTIONS.includes(value as StatusKepesertaan);
}
