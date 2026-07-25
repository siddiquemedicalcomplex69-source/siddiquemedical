import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { FlaskConical, Phone, CheckCircle2, XCircle, CalendarDays, Loader2 } from "lucide-react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Reveal, Stagger } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statusLabel, statusClass, type LabBookingStatus } from "@/types/database";
import { cn } from "@/lib/utils";
import { notify, notifyAdmins } from "@/lib/notify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllLabBookings, updateLabBooking } from "@/lib/api";
import type { LabBookingDetail } from "@/types/database";

const TABS: { key: LabBookingStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "sample_date_set", label: "Sample Date Set" },
  { key: "report_date_set", label: "Report Date Set" },
  { key: "completed", label: "Completed" },
];

function fmt(d: string | null) {
  if (!d) return "—";
  try { return format(parseISO(d), "d MMM yyyy"); } catch { return d; }
}

function LabPortalPage() {
  const queryClient = useQueryClient();
  const { data: items = [] as LabBookingDetail[] } = useQuery<LabBookingDetail[]>({
    queryKey: ['allLabBookings'],
    queryFn: getAllLabBookings as any
  });
  
  const [tab, setTab] = useState<LabBookingStatus | "all">("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [completingId, setCompletingId] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => updateLabBooking(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allLabBookings'] })
  });

  const filtered = useMemo(
    () => tab === "all" ? items : items.filter((i) => i.status === tab),
    [items, tab],
  );

  const stats = useMemo(() => ({
    total: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    inProgress: items.filter((i) => i.status === "sample_date_set" || i.status === "report_date_set").length,
    completed: items.filter((i) => i.status === "completed").length,
  }), [items]);

  const setDraft = (id: string, v: string) => setDrafts((d) => ({ ...d, [id]: v }));

  const setSampleDate = async (id: string) => {
    const date = drafts[id];
    if (!date) { toast.error("Pick a sample collection date"); return; }
    
    const booking = items.find(i => i.id === id);
    if (!booking) return;

    await updateMutation.mutateAsync({ id, updates: { status: "sample_date_set", sample_collection_date: date } });
    
    const formattedSampleDate = format(parseISO(date), "EEE, d MMM");
    await notify({
      user_id : booking.patient_id,
      type    : 'lab_sample_date_set',
      title   : 'Sample Collection Date Set',
      message : `Please visit the lab on ${formattedSampleDate} to give your sample for ${booking.test_name}. Bring your booking confirmation.`,
      metadata: { lab_booking_id: booking.id }
    });

    toast.success("Sample collection date set.", { description: "Patient has been notified." });
  };

  const setReportDate = async (id: string) => {
    const date = drafts[id];
    if (!date) { toast.error("Pick a report collection date"); return; }
    
    const booking = items.find(i => i.id === id);
    if (!booking) return;

    await updateMutation.mutateAsync({ id, updates: { status: "report_date_set", report_collection_date: date } });
    
    const formattedReportDate = format(parseISO(date), "EEE, d MMM");
    await notify({
      user_id : booking.patient_id,
      type    : 'lab_report_date_set',
      title   : 'Report Ready for Collection',
      message : `Your report for ${booking.test_name} will be ready for collection on ${formattedReportDate}. Please visit the lab to collect it in person.`,
      metadata: { lab_booking_id: booking.id }
    });

    toast.success("Report collection date set.", { description: "Patient has been notified." });
  };

  const markCompleted = async (id: string) => {
    if (completingId) return;
    setCompletingId(id);
    try {
      const booking = items.find(i => i.id === id);
      if (!booking) return;

      await updateMutation.mutateAsync({ id, updates: { status: "completed" } });
      
      if (booking.report_collection_date) {
        const formattedReportDate = format(parseISO(booking.report_collection_date), "EEE, d MMM");
        await notify({
          user_id : booking.patient_id,
          type    : 'lab_report_date_set',
          title   : 'Process Complete',
          message : `Your ${booking.test_name} process is complete. Please visit us on ${formattedReportDate} to collect your report.`,
          metadata: { lab_booking_id: booking.id }
        });
      }

      await notifyAdmins({
        type    : 'lab_report_date_set',
        title   : 'Lab Test Completed',
        message : `Lab test ${booking.test_name} for ${booking.patient_name} has been marked as completed.`,
        metadata: { lab_booking_id: booking.id }
      });

      toast.success("Booking marked as completed");
    } finally {
      setCompletingId(null);
    }
  };

  const cancel = async (id: string) => {
    const booking = items.find(i => i.id === id);
    if (!booking) return;

    await updateMutation.mutateAsync({ id, updates: { status: "cancelled" } });
    
    await notify({
      user_id : booking.patient_id,
      type    : 'appointment_cancelled',
      title   : 'Lab Booking Cancelled',
      message : `Your lab test booking for ${booking.test_name} has been cancelled. Please contact us for more information.`,
      metadata: { lab_booking_id: booking.id }
    });

    await notifyAdmins({
      type    : 'appointment_cancelled',
      title   : 'Lab Booking Cancelled',
      message : `Lab test booking ${booking.test_name} for ${booking.patient_name} has been cancelled.`,
      metadata: { lab_booking_id: booking.id }
    });

    toast.success("Booking cancelled");
  };

  return (
    <div className="min-h-screen animate-fade-in">
      <Navbar />

      <section className="bg-gradient-to-br from-[#0b1f3a] via-[#0e2a4d] to-[#14b8a6] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <Reveal>
            <div className="flex items-center gap-3">
              <FlaskConical className="h-5 w-5" />
              <h1 className="text-3xl font-bold font-[Sora]">Lab Portal</h1>
              <Badge className="bg-white/20 border-white/30 text-white">{stats.pending} pending</Badge>
            </div>
            <p className="mt-2 text-white/80">Manage bookings, set sample & report collection dates.</p>
          </Reveal>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Total Bookings" value={stats.total} />
            <Stat label="Pending" value={stats.pending} />
            <Stat label="In Progress" value={stats.inProgress} />
            <Stat label="Completed" value={stats.completed} />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex min-w-max gap-2 pb-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  tab === t.key
                    ? "bg-[#0b1f3a] text-white border-[#0b1f3a] shadow"
                    : "bg-white text-[#0b1f3a] border-border hover:border-[#14b8a6]/50",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            No bookings in this view.
          </div>
        ) : (
          <Stagger className="mt-6 grid grid-cols-1 gap-4">
            {filtered.map((b) => (
              <Card key={b.id} className="border-2 hover:shadow-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-[#0b1f3a]">{b.patient_name}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" /> {b.patient_phone}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="font-medium text-[#0b1f3a]">{b.test_name}</span>
                        <Badge variant="secondary" className="text-[10px]">{b.test_code}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Booked {fmt(b.booking_date)} {b.price ? `• Rs. ${b.price.toLocaleString()}` : ""}
                      </div>
                    </div>
                    <Badge className={cn("border", statusClass[b.status], b.status === "pending" && "animate-pulse")}>
                      {statusLabel[b.status]}
                    </Badge>
                  </div>

                  {b.status === "pending" && (
                    <ActionRow label="Set Sample Collection Date" onConfirm={() => setSampleDate(b.id)}>
                      <Input type="date" value={drafts[b.id] ?? ""} onChange={(e) => setDraft(b.id, e.target.value)} className="max-w-xs" />
                    </ActionRow>
                  )}

                  {b.status === "sample_date_set" && (
                    <>
                      <DatesRow sample={b.sample_collection_date} report={null} />
                      <ActionRow label="Set Report Collection Date" onConfirm={() => setReportDate(b.id)}>
                        <Input type="date" value={drafts[b.id] ?? ""} onChange={(e) => setDraft(b.id, e.target.value)} className="max-w-xs" />
                      </ActionRow>
                    </>
                  )}

                  {b.status === "report_date_set" && (
                    <>
                      <DatesRow sample={b.sample_collection_date} report={b.report_collection_date} />
                      <div className="mt-4 flex justify-end">
                        <Button 
                          disabled={completingId === b.id}
                          onClick={() => markCompleted(b.id)} 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {completingId === b.id ? (
                            <>
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Completing...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark as Completed
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}

                  {b.status === "completed" && (
                    <DatesRow sample={b.sample_collection_date} report={b.report_collection_date} />
                  )}

                  {b.status !== "completed" && b.status !== "cancelled" && (
                    <div className="mt-3 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => cancel(b.id)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                        <XCircle className="mr-1.5 h-4 w-4" /> Cancel booking
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stagger>
        )}
      </main>

      <Footer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur border border-white/20 p-4">
      <div className="text-xs uppercase tracking-wider text-white/70">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function DatesRow({ sample, report }: { sample: string | null; report: string | null }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <div className="rounded-lg bg-[#14b8a6]/10 border border-[#14b8a6]/30 p-3 text-sm text-[#0f766e] flex items-center gap-2">
        <CalendarDays className="h-4 w-4" /> Sample date: <strong>{fmt(sample)}</strong>
      </div>
      <div className="rounded-lg bg-[#0b1f3a]/5 border border-[#0b1f3a]/20 p-3 text-sm text-[#0b1f3a] flex items-center gap-2">
        <CalendarDays className="h-4 w-4" /> Report date: <strong>{fmt(report)}</strong>
      </div>
    </div>
  );
}

function ActionRow({ label, onConfirm, children }: { label: string; onConfirm: () => void; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border bg-slate-50/60 p-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-[#0b1f3a]/70">{label}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {children}
        <Button onClick={onConfirm} className="bg-[#14b8a6] hover:bg-[#0d9488] text-white">Confirm Date</Button>
      </div>
    </div>
  );
}

export default LabPortalPage;
