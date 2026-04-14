import { create } from 'zustand';
import { format } from 'date-fns';

export interface TherapySlot {
  id: string;
  time: string;
  available: boolean;
}

export interface TherapyQuota {
  date: string;
  maxQuota: number;
  booked: number;
  slots: TherapySlot[];
}

interface BookingState {
  selectedDate: Date | undefined;
  quotaInfo: TherapyQuota | null;
  isLoadingQuota: boolean;
  setSelectedDate: (date: Date | undefined) => void;
  fetchQuotaForDate: (date: Date) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  setIsSubmitting: (status: boolean) => void;
  setError: (value: string | null) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedDate: undefined,
  quotaInfo: null,
  isLoadingQuota: false,
  setSelectedDate: (date) => set({ selectedDate: date }),
  fetchQuotaForDate: async (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    set({ isLoadingQuota: true });
    try {
      const [quotaRes, sesiRes] = await Promise.all([
        fetch(`/api/terapi/quota?tanggal=${encodeURIComponent(dateStr)}`),
        fetch(`/api/terapi/sesi?tanggal=${encodeURIComponent(dateStr)}`),
      ]);

      const quotaJson = await quotaRes.json();
      const sesiJson = await sesiRes.json();

      if (!quotaRes.ok || !quotaJson.success) {
        throw new Error(quotaJson.message || 'Gagal mengambil kuota');
      }
      if (!sesiRes.ok || !sesiJson.success) {
        throw new Error(sesiJson.message || 'Gagal mengambil sesi');
      }

      const quotaData = quotaJson.data as {
        tanggal: string;
        kuota_max: number;
        kuota_terpakai: number;
      };
      const sesiData = sesiJson.data as Array<{
        id: string;
        jam: string;
        tersedia: boolean;
      }>;

      set({
        error: null,
        isLoadingQuota: false,
        quotaInfo: {
          date: quotaData.tanggal,
          maxQuota: quotaData.kuota_max,
          booked: quotaData.kuota_terpakai,
          slots: sesiData.map((item) => ({
            id: item.id,
            time: item.jam,
            available: item.tersedia,
          })),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memuat data kuota';
      set({ error: message, quotaInfo: null, isLoadingQuota: false });
    }
  },
  isSubmitting: false,
  error: null,
  setIsSubmitting: (status) => set({ isSubmitting: status }),
  setError: (value) => set({ error: value }),
}));
