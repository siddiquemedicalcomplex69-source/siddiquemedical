import type { Availability } from "@/types/database";

export type TimeSlot = {
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  is_available: boolean;
};

const DAY_NAMES = [
  "sunday", "monday", "tuesday", "wednesday",
  "thursday", "friday", "saturday",
] as const;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function generateSlots(
  date: Date,
  availability: Availability[],
  leaves: string[], // ISO date strings YYYY-MM-DD
  bookedStartTimes: string[], // HH:MM already taken for this date
  slotDurationMin: number,
): TimeSlot[] {
  const iso = date.toISOString().slice(0, 10);
  if (leaves.includes(iso)) return [];

  const day = DAY_NAMES[date.getDay()];
  const blocks = availability.filter((a) => a.day === day);
  const booked = new Set(bookedStartTimes);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const slots: TimeSlot[] = [];
  for (const block of blocks) {
    const start = toMinutes(block.start_time);
    const end = toMinutes(block.end_time);
    for (let t = start; t + slotDurationMin <= end; t += slotDurationMin) {
      const s = fromMinutes(t);
      const e = fromMinutes(t + slotDurationMin);
      const inPast = isToday && t <= nowMins;
      slots.push({
        start_time: s,
        end_time: e,
        is_available: !booked.has(s) && !inPast,
      });
    }
  }
  return slots;
}

export function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m.toString().padStart(2, "0")} ${suffix}`;
}
