import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { format, parseISO, isBefore, startOfToday } from "date-fns";
import { CalendarPlus, Clock, Stethoscope, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/lib/auth";
import { getUserAppointments, cancelAppointment } from "@/lib/api";
import type { AppointmentDetail } from "@/types/database";
import { formatTime12 } from "@/lib/slots";
import { notify, notifyAdmins } from "@/lib/notify";

export default function AppointmentsPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (ready && !user) navigate("/login?redirectTo=/appointments", { replace: true });
  }, [ready, user, navigate]);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', user?.id],
    queryFn: () => getUserAppointments(user!.id),
    enabled: !!user?.id,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelAppointment,
    onSuccess: async (_, id) => {
      const appointment = appointments.find(a => a.id === id);
      if (appointment) {
        const formattedDate = format(parseISO(appointment.appointment_date), "EEE, d MMM");
        const formattedTime = formatTime12(appointment.start_time);
        
        await notify({
          user_id : user!.id,
          type    : 'appointment_cancelled',
          title   : 'Appointment Cancelled',
          message : `You have cancelled your appointment with ${appointment.doctor_name} on ${formattedDate}.`,
          metadata: { appointment_id: appointment.id }
        });
        
        if (appointment.doctor_profile_id) {
          await notify({
            user_id : appointment.doctor_profile_id,
            type    : 'appointment_cancelled',
            title   : 'Appointment Cancelled by Patient',
            message : `${appointment.patient_name} has cancelled their appointment on ${formattedDate} at ${formattedTime}.`,
            metadata: { appointment_id: appointment.id }
          });
        }
        
        await notifyAdmins({
          type    : 'appointment_cancelled',
          title   : 'Appointment Cancelled by Patient',
          message : `${appointment.patient_name} has cancelled their appointment with Dr. ${appointment.doctor_name} on ${formattedDate} at ${formattedTime}.`,
          metadata: { appointment_id: appointment.id }
        });
      }

      toast.success("Appointment cancelled");
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      if (appointment) {
        queryClient.invalidateQueries({ queryKey: ['bookedSlots', appointment.doctor_id] });
      }
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Failed to cancel");
    }
  });

  const { upcoming, past } = useMemo(() => {
    const today = startOfToday();
    const upcoming: AppointmentDetail[] = [];
    const past: AppointmentDetail[] = [];
    for (const a of appointments) {
      const d = parseISO(a.appointment_date);
      if (a.status === "cancelled" || isBefore(d, today)) past.push(a);
      else upcoming.push(a);
    }
    return { upcoming: upcoming.reverse(), past }; // ascending upcoming, descending past
  }, [appointments]);

  if (!ready || !user || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background page-fade">
        <Navbar />
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-[#0b1f3a] to-[#0f766e] text-white">
          <div className="absolute inset-0 dot-grid opacity-20" />
          <div className="relative mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-12">
            <div>
              <Skeleton className="h-5 w-24 mb-2 bg-white/20" />
              <Skeleton className="h-10 w-64 mb-1 bg-white/20" />
              <Skeleton className="h-5 w-48 bg-white/20" />
            </div>
            <Skeleton className="h-10 w-32 bg-white/20" />
          </div>
        </section>
        <section className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="grid gap-3 mt-14">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-fade">
      <Navbar />
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-[#0b1f3a] to-[#0f766e] text-white">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5eead4]">Your visits</p>
            <h1 className="mt-2 text-4xl font-bold">My appointments</h1>
            <p className="mt-1 text-sm text-white/70">
              Welcome back, {user.full_name}. Manage your upcoming visits below.
            </p>
          </div>
          <Button asChild className="bg-[#14b8a6] hover:bg-[#0d9488] btn-shimmer hover:scale-105 active:scale-95 transition-all duration-300">
            <Link to="/doctors"><CalendarPlus className="mr-1.5 h-4 w-4" /> Book new</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 flex-1">
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-6">
            {upcoming.length === 0 ? (
              <EmptyStateComponent />
            ) : (
              <div className="grid gap-3 stagger" data-in="true" style={{ ["--stagger" as string]: "80ms" }}>
                {upcoming.map((a) => (
                  <AppointmentRow
                    key={a.id}
                    appt={a}
                    onCancel={() => cancelMutation.mutate(a.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="past" className="mt-6">
            {past.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center text-sm text-muted-foreground">
                No past appointments yet.
              </p>
            ) : (
              <div className="grid gap-3 stagger" data-in="true" style={{ ["--stagger" as string]: "80ms" }}>
                {past.map((a) => <AppointmentRow key={a.id} appt={a} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
      <Footer />
    </div>
  );
}

function AppointmentRow({ appt, onCancel }: { appt: AppointmentDetail; onCancel?: () => void }) {
  const date = parseISO(appt.appointment_date);
  const statusVariant: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 animate-pulse",
    confirmed: "bg-emerald-100 text-emerald-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-rose-100 text-rose-800",
    no_show: "bg-gray-100 text-gray-800",
  };
  return (
    <Card className="hover-lift hover:border-[#14b8a6]/50 border-border">
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#14b8a6]/15 to-[#14b8a6]/5 text-[#14b8a6]">
            <Stethoscope className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[#0b1f3a]">{appt.doctor_name}</h3>
              <Badge variant="secondary" className="rounded-full text-[11px]">{appt.department_name}</Badge>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusVariant[appt.status] || statusVariant.pending}`}>
                {appt.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{appt.doctor_specialty}</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-foreground">
              <Clock className="h-3.5 w-3.5 text-[#14b8a6]" />
              {format(date, "EEE, d MMM yyyy")} · {formatTime12(appt.start_time)}
            </p>
            {appt.reason && (
              <p className="mt-1 text-xs text-muted-foreground">Reason: {appt.reason}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#0b1f3a]">Rs. {appt.fee_charged || "---"}</span>
          {onCancel && appt.status === "pending" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="border-rose-300 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <XCircle className="mr-1 h-4 w-4" /> Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyStateComponent() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-14 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#14b8a6]/10 text-[#14b8a6] bounce-in">
        <CalendarPlus className="h-9 w-9" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-[#0b1f3a]">No upcoming appointments</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Find a specialist and book your first visit in seconds.
      </p>
      <Button asChild className="mt-6 bg-[#14b8a6] hover:bg-[#0d9488] btn-shimmer hover:scale-105 active:scale-95 transition-all duration-300 text-white">
        <Link to="/doctors">Book an Appointment</Link>
      </Button>
    </div>
  );
}
