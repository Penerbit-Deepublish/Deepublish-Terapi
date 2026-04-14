export interface TherapySlot {
  id: string;
  time: string;
  available: boolean;
}

export interface TherapyQuota {
  date: string; // YYYY-MM-DD
  maxQuota: number;
  booked: number;
  slots: TherapySlot[];
}

export const MOCK_SLOTS: TherapySlot[] = [
  { id: "s1", time: "09:00 - 10:00", available: true },
  { id: "s2", time: "10:00 - 11:00", available: true },
  { id: "s3", time: "11:00 - 12:00", available: false },
  { id: "s4", time: "13:00 - 14:00", available: true },
  { id: "s5", time: "14:00 - 15:00", available: true },
  { id: "s6", time: "15:00 - 16:00", available: true },
  { id: "s7", time: "16:00 - 17:00", available: false },
  { id: "s8", time: "19:00 - 20:00", available: true },
  { id: "s9", time: "20:00 - 21:00", available: true },
];

export const getMockQuota = (dateStr: string): TherapyQuota => {
  // Return random mock data for the selected date
  // Fixed predictability for UI testing
  const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6;
  const maxQuota = isWeekend ? 15 : 10;
  const booked = isWeekend ? 12 : 5;
  
  return {
    date: dateStr,
    maxQuota,
    booked,
    slots: MOCK_SLOTS.map((slot, index) => ({
      ...slot,
      available: isWeekend ? index % 2 === 0 : index % 3 !== 0
    }))
  };
};
