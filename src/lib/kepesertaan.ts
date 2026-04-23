export const INSTANSI_OPTIONS = ["Deepublish", "IMBS"] as const;

export type Instansi = (typeof INSTANSI_OPTIONS)[number];

export const DEEPUBLISH_STATUS_KEPESERTAAN_OPTIONS = [
  "Karyawan",
  "Keluarga Karyawan",
  "Mitra Kerja",
  "Keluarga Mitra Kerja",
  "Konsumen",
  "Keluarga Konsumen",
] as const;

export const IMBS_STATUS_KEPESERTAAN_OPTIONS = [
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

export const STATUS_KEPESERTAAN_OPTIONS = [
  ...DEEPUBLISH_STATUS_KEPESERTAAN_OPTIONS,
  ...IMBS_STATUS_KEPESERTAAN_OPTIONS,
] as const;

export type StatusKepesertaan = (typeof STATUS_KEPESERTAAN_OPTIONS)[number];

export function isInstansi(value: unknown): value is Instansi {
  if (typeof value !== "string") return false;
  return INSTANSI_OPTIONS.includes(value as Instansi);
}

export function isStatusKepesertaan(value: unknown): value is StatusKepesertaan {
  if (typeof value !== "string") return false;
  return STATUS_KEPESERTAAN_OPTIONS.includes(value as StatusKepesertaan);
}

export function getStatusKepesertaanOptions(instansi?: Instansi | "") {
  if (instansi === "Deepublish") return DEEPUBLISH_STATUS_KEPESERTAAN_OPTIONS;
  if (instansi === "IMBS") return IMBS_STATUS_KEPESERTAAN_OPTIONS;
  return [];
}

export function isStatusValidForInstansi(instansi: Instansi, status: string) {
  return getStatusKepesertaanOptions(instansi).some((option) => option === status);
}
