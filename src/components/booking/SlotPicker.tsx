import { useMemo, useState } from "react";
import { addDays, format, isSameDay, startOfToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTime12, generateSlots, type TimeSlot } from "@/lib/slots";
import { useQuery } from "@tanstack/react-query";
import { getBookedSlots, getDoctorAvailability, getDoctorLeaves } from "@/lib/api";

type Props = {
  doctorId: string;
  slotDurationMin: number;
  onSelect: (date: Date, slot: TimeSlot) => void;
};

export function SlotPicker({ doctorId, slotDurationMin, onSelect }: Props) {
  const today = startOfToday();
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(today, i)),
    [today],
  );
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: availability = [] } = useQuery({
    queryKey: ['availability', doctorId],
    queryFn: () => getDoctorAvailability(doctorId),
  });

  const { data: leaves = [] } = useQuery({
    queryKey: ['leaves', doctorId, dateStr],
    queryFn: () => getDoctorLeaves(doctorId, dateStr),
  });

  const { data: booked = [] } = useQuery({
    queryKey: ['bookedSlots', doctorId, dateStr],
    queryFn: () => getBookedSlots(doctorId, dateStr),
  });

  // Need to adapt API types (which are lower case days) to what slots.ts expects.
  // Actually slots.ts maps day from JS `getDay()` to a string array.
  const mappedAvail = availability.map(a => ({
    day: a.day,
    start_time: a.start_time.slice(0, 5), // '09:00:00' -> '09:00'
    end_time: a.end_time.slice(0, 5)
  }));
  
  const mappedBooked = booked.map(t => t.slice(0, 5));

  const slots = generateSlots(selectedDate, mappedAvail as any, leaves, mappedBooked, slotDurationMin);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Select a date</h3>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => {
            const active = isSameDay(d, selectedDate);
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelectedDate(d)}
                className={cn(
                  "flex min-w-[68px] flex-col items-center rounded-lg border px-3 py-2 text-xs transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-brand/60",
                )}
              >
                <span className={cn("font-medium", active ? "opacity-90" : "text-muted-foreground")}>
                  {format(d, "EEE")}
                </span>
                <span className="mt-0.5 text-base font-semibold">{format(d, "d")}</span>
                <span className={cn(active ? "opacity-90" : "text-muted-foreground")}>
                  {format(d, "MMM")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Available slots — {format(selectedDate, "EEEE, d MMM")}
        </h3>
        {slots.length === 0 ? (
          <p className="mt-3 rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            The doctor is not available on this day. Please pick another date.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2 min-[400px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5">
            {slots.map((s) => (
              <Button
                key={s.start_time}
                variant={s.is_available ? "outline" : "ghost"}
                size="sm"
                disabled={!s.is_available}
                onClick={() => onSelect(selectedDate, s)}
                className={cn(
                  "justify-center",
                  !s.is_available && "text-muted-foreground/60 line-through",
                )}
              >
                {formatTime12(s.start_time)}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
