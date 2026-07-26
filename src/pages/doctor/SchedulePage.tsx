import { useMemo, useState } from "react";
import { format, parse, parseISO } from "date-fns";
import { CalendarIcon, Check, X, CheckCircle2, Clock, Phone, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getDoctorIdByProfileId, getDoctorAppointments, updateAppointmentStatus, getDoctorPendingAppointments } from "@/lib/api";
import { formatTime12 } from "@/lib/slots";
import { notify, notifyAdmins } from "@/lib/notify";
import type { AppointmentDetail } from "@/types/database";

type ApptStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

function fmtTime(t: string) {
  return format(parse(t, "HH:mm:ss", new Date()), "h:mm a");
}

const statusStyles: Record<ApptStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  no_show: "bg-red-100 text-red-800 border-red-200",
};

export default function SchedulePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const [showAllPending, setShowAllPending] = useState(false);

  const { data: doctorId } = useQuery({
    queryKey: ["doctor_id", user?.id],
    queryFn: () => getDoctorIdByProfileId(user!.id),
    enabled: !!user?.id,
  });

  const iso = format(date, "yyyy-MM-dd");
  const todayIso = format(new Date(), "yyyy-MM-dd");

  // 1. Fetch daily agenda
  const { data: dailyAppointments = [], isLoading: dailyLoading } = useQuery({
    queryKey: ["doctor_appointments", doctorId, iso],
    queryFn: () => getDoctorAppointments(doctorId!, iso),
    enabled: !!doctorId,
  });

  // 2. Fetch all pending requests from today onwards
  const { data: pendingRequests = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["doctor_pending_appointments", doctorId, todayIso],
    queryFn: () => getDoctorPendingAppointments(doctorId!, todayIso),
    enabled: !!doctorId,
  });

  const isLoading = dailyLoading || pendingLoading;

  const mutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApptStatus }) => {
      await updateAppointmentStatus(id, status);
    },
    onSuccess: async (_, variables) => {
      const appt = dailyAppointments.find(a => a.id === variables.id) || pendingRequests.find(a => a.id === variables.id);
      if (appt) {
        const newStatus = variables.status;
        const formattedDate = format(parseISO(appt.appointment_date), "EEE, d MMM");
        const formattedTime = formatTime12(appt.start_time);
        const doctorName = user!.full_name;

        if (newStatus === 'confirmed') {
          await notify({
            user_id : appt.patient_id,
            type    : 'appointment_confirmed',
            title   : 'Appointment Confirmed',
            message : `Dr. ${doctorName} has confirmed your appointment on ${formattedDate} at ${formattedTime}.`,
            metadata: { appointment_id: appt.id }
          });
          await notifyAdmins({
            type    : 'appointment_confirmed',
            title   : 'Appointment Confirmed by Doctor',
            message : `Dr. ${doctorName} has confirmed their appointment with ${appt.patient_name} on ${formattedDate} at ${formattedTime}.`,
            metadata: { appointment_id: appt.id }
          });
        }
        if (newStatus === 'no_show') {
          await notify({
            user_id : appt.patient_id,
            type    : 'appointment_no_show',
            title   : 'Missed Appointment',
            message : `You were marked as no-show for your appointment with Dr. ${doctorName} on ${formattedDate}.`,
            metadata: { appointment_id: appt.id }
          });
          await notifyAdmins({
            type    : 'appointment_no_show',
            title   : 'Patient No-Show',
            message : `Dr. ${doctorName} has marked ${appt.patient_name} as a no-show on ${formattedDate}.`,
            metadata: { appointment_id: appt.id }
          });
        }
        if (newStatus === 'cancelled') {
          await notify({
            user_id : appt.patient_id,
            type    : 'appointment_cancelled',
            title   : 'Appointment Cancelled',
            message : `Your appointment with Dr. ${doctorName} on ${formattedDate} has been cancelled.`,
            metadata: { appointment_id: appt.id }
          });
          await notifyAdmins({
            type    : 'appointment_cancelled',
            title   : 'Appointment Cancelled by Doctor',
            message : `Dr. ${doctorName} has cancelled their appointment with ${appt.patient_name} on ${formattedDate}.`,
            metadata: { appointment_id: appt.id }
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["doctor_appointments", doctorId, iso] });
      queryClient.invalidateQueries({ queryKey: ["doctor_pending_appointments", doctorId, todayIso] });
      toast.success(`Appointment marked as ${variables.status.replace("_", " ")}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = useMemo(() => ({
    total: dailyAppointments.length,
    pending: dailyAppointments.filter((a) => a.status === "pending").length,
    completed: dailyAppointments.filter((a) => a.status === "completed").length,
  }), [dailyAppointments]);

  const visiblePending = showAllPending ? pendingRequests : pendingRequests.slice(0, 3);

  // Loading handled inline below

  return (
    <div className="flex min-h-screen flex-col bg-background page-fade">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">My Schedule</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review and manage your appointments.</p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[260px] justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "EEEE, dd MMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1 text-sm">Today's Total: {stats.total}</Badge>
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 px-3 py-1 text-sm">Pending Actions: {pendingRequests.length}</Badge>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 px-3 py-1 text-sm">Today's Completed: {stats.completed}</Badge>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* PENDING REQUESTS SECTION */}
            {pendingRequests.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-4 text-lg font-semibold text-red-600 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  Action Required: Pending Requests
                </h2>
                <div className="space-y-3 border-l-2 border-red-500 pl-4">
                  {visiblePending.map((a) => (
                    <Card key={a.id} className="border-red-100 bg-red-50/50">
                      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {a.patient_name}
                            <Badge variant="outline" className={cn("ml-2 capitalize", statusStyles[a.status as ApptStatus])}>
                              {a.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-red-800">
                            <span className="flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" />{format(parse(a.appointment_date, "yyyy-MM-dd", new Date()), "MMM dd, yyyy")}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{fmtTime(a.start_time)} – {fmtTime(a.end_time)}</span>
                            {a.patient_phone && (
                              <a href={`tel:${a.patient_phone}`} className="flex items-center gap-1 hover:underline">
                                {a.patient_phone}
                              </a>
                            )}
                          </div>
                          {a.reason && <p className="text-sm text-muted-foreground">Reason: {a.reason}</p>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => mutation.mutate({ id: a.id, status: "confirmed" })} disabled={mutation.isPending}>
                            <Check className="mr-1 h-4 w-4" /> Confirm
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => mutation.mutate({ id: a.id, status: "cancelled" })} disabled={mutation.isPending}>
                            <X className="mr-1 h-4 w-4" /> Decline
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {pendingRequests.length > 3 && (
                    <Button 
                      variant="ghost" 
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 mt-2" 
                      onClick={() => setShowAllPending(!showAllPending)}
                    >
                      {showAllPending ? "Show Less" : `View all ${pendingRequests.length} pending requests`}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* DAILY AGENDA SECTION */}
            <h2 className="mb-4 text-lg font-semibold">Daily Agenda for {format(date, "MMM dd, yyyy")}</h2>
            
            {dailyAppointments.length === 0 ? (
              <EmptyState title="No appointments scheduled for this date" />
            ) : (
              <div className="space-y-3">
                {dailyAppointments.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {a.patient_name}
                          <Badge variant="outline" className={cn("ml-2 capitalize", statusStyles[a.status as ApptStatus])}>
                            {a.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{fmtTime(a.start_time)} – {fmtTime(a.end_time)}</span>
                          {a.patient_phone && (
                            <a href={`tel:${a.patient_phone}`} className="flex items-center gap-1 text-[#0d766e] hover:underline">
                              {a.patient_phone}
                            </a>
                          )}
                        </div>
                        {a.reason && <p className="text-sm text-muted-foreground">Reason: {a.reason}</p>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {a.status === "pending" && (
                          <Button size="sm" onClick={() => mutation.mutate({ id: a.id, status: "confirmed" })} disabled={mutation.isPending}>
                            <Check className="mr-1 h-4 w-4" /> Confirm
                          </Button>
                        )}
                        {a.status === "confirmed" && (
                          <>
                            <Button size="sm" onClick={() => mutation.mutate({ id: a.id, status: "completed" })} disabled={mutation.isPending}>
                              <CheckCircle2 className="mr-1 h-4 w-4" /> Mark Complete
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => mutation.mutate({ id: a.id, status: "no_show" })} disabled={mutation.isPending}>
                              <X className="mr-1 h-4 w-4" /> Mark No Show
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
