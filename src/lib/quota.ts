import { INSTANSI_OPTIONS, type Instansi } from "@/lib/kepesertaan";

export const MAX_BOOKING_PER_INSTANSI_PER_SESSION = 4;
export const MAX_BOOKING_PER_GENDER_PER_INSTANSI_PER_SESSION = 2;

export type InstansiScope = Instansi | "ALL";

export function getMaxBookingPerSession(scope: InstansiScope = "ALL") {
  if (scope === "ALL") {
    return MAX_BOOKING_PER_INSTANSI_PER_SESSION * INSTANSI_OPTIONS.length;
  }
  return MAX_BOOKING_PER_INSTANSI_PER_SESSION;
}

export function getMaxBookingPerGenderPerSession(scope: InstansiScope = "ALL") {
  if (scope === "ALL") {
    return MAX_BOOKING_PER_GENDER_PER_INSTANSI_PER_SESSION * INSTANSI_OPTIONS.length;
  }
  return MAX_BOOKING_PER_GENDER_PER_INSTANSI_PER_SESSION;
}

