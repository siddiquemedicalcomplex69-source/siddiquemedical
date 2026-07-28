// @ts-nocheck
import { useState } from "react";
import { format, parse, startOfToday } from "date-fns";
import { CalendarIcon, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  getDoctorIdByProfileId,
  getDoctorAllAvailability,
  addDoctorAvailability,
  deleteDoctorAvailability,
} from "@/lib/api";
import type { Availability } from "@/types/database";

type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
const DAYS: Day[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function fmtTime(t: string) {
  return format(parse(t, "HH:mm:ss", new Date()), "h:mm a");
}

export default function AvailabilityPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [drafts, setDrafts] = useState<Record<Day, { start: string; end: string; open: boolean; error?: string }>>(
    () => Object.fromEntries(DAYS.map((d) => [d, { start: "09:00", end: "17:00", open: false }])) as any,
  );

  const { data: doctorId } = useQuery({
    queryKey: ["doctor_id", user?.id],
    queryFn: () => getDoctorIdByProfileId(user!.id),
    enabled: !!user?.id,
  });

  const { data: blocks = [], isLoading: loadingBlocks } = useQuery({
    queryKey: ["availability", doctorId],
    queryFn: () => getDoctorAllAvailability(doctorId!),
    enabled: !!doctorId,
  });

  const addBlockMut = useMutation({
    mutationFn: (block: { day: string; start_time: string; end_time: string }) => 
      addDoctorAvailability({ doctor_id: doctorId!, ...block }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["availability", doctorId] });
      setDrafts((p) => ({ ...p, [variables.day]: { ...p[variables.day as Day], open: false, error: undefined } }));
      toast.success("Time block added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBlockMut = useMutation({
    mutationFn: (id: string) => deleteDoctorAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability", doctorId] });
      toast.success("Time block removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const addBlock = (day: Day) => {
    const d = drafts[day];
    if (d.end <= d.start) {
      setDrafts((p) => ({ ...p, [day]: { ...p[day], error: "End time must be after start time" } }));
      return;
    }
    addBlockMut.mutate({ day, start_time: `${d.start}:00`, end_time: `${d.end}:00` });
  };
  // Loading is handled inline below

  return (
    <div className="flex min-h-screen flex-col bg-background page-fade">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Availability</h1>
          <p className="mt-1 text-sm text-muted-foreground">Set your weekly schedule and one-off leave dates.</p>
        </div>

        <Card className="mb-8">
          <CardHeader><CardTitle>Weekly Schedule</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loadingBlocks ? (
              <div className="space-y-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : DAYS.map((day) => {
              const dayBlocks = blocks.filter((b) => b.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
              const draft = drafts[day];
              return (
                <div key={day} className="rounded-md border border-border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-medium capitalize">{day}</div>
                    <Button size="sm" variant="outline" onClick={() => setDrafts((p) => ({ ...p, [day]: { ...p[day], open: !p[day].open, error: undefined } }))}>
                      <Plus className="mr-1 h-4 w-4" /> Add Time Block
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {dayBlocks.length === 0 && !draft.open && (
                      <p className="text-sm text-muted-foreground">No time blocks for this day.</p>
                    )}
                    {dayBlocks.map((b) => (
                      <div key={b.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                        <span>{fmtTime(b.start_time)} – {fmtTime(b.end_time)}</span>
                        <Button size="icon" variant="ghost" onClick={() => deleteBlockMut.mutate(b.id)} aria-label="Delete block" disabled={deleteBlockMut.isPending}>
                          {deleteBlockMut.isPending ? <Loader2 className="h-4 w-4 animate-spin text-destructive" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                        </Button>
                      </div>
                    ))}
                    {draft.open && (
                      <div className="flex flex-wrap items-end gap-3 rounded-md border border-dashed border-border p-3">
                        <div className="w-full sm:w-auto">
                          <Label className="text-xs">Start</Label>
                          <Input type="time" value={draft.start} onChange={(e) => setDrafts((p) => ({ ...p, [day]: { ...p[day], start: e.target.value, error: undefined } }))} className="w-full sm:w-32" />
                        </div>
                        <div className="w-full sm:w-auto">
                          <Label className="text-xs">End</Label>
                          <Input type="time" value={draft.end} onChange={(e) => setDrafts((p) => ({ ...p, [day]: { ...p[day], end: e.target.value, error: undefined } }))} className="w-full sm:w-32" />
                        </div>
                        <Button size="sm" onClick={() => addBlock(day)} disabled={addBlockMut.isPending}>
                          {addBlockMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Add
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDrafts((p) => ({ ...p, [day]: { ...p[day], open: false, error: undefined } }))} disabled={addBlockMut.isPending}>Cancel</Button>
                        {draft.error && <p className="w-full text-xs text-destructive">{draft.error}</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

      </main>
      <Footer />
    </div>
  );
}
