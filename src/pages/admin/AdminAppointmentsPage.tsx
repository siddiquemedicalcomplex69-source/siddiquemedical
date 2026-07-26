import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { getAllAppointments, updateAppointmentStatus } from "@/lib/api";
import { notify } from "@/lib/notify";
import { formatTime12 } from "@/lib/slots";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  no_show: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function AdminAppointmentsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["adminAppointments"],
    queryFn: getAllAppointments,
  });

  const statusMutation = useMutation({
    mutationFn: (data: { id: string, status: string }) => updateAppointmentStatus(data.id, data.status),
    onSuccess: async (_, variables) => {
      const appointment = appointments.find((a: any) => a.id === variables.id);
      if (appointment) {
        const newStatus = variables.status;
        const formattedDate = format(parseISO(appointment.appointment_date), "EEE, d MMM");
        const formattedTime = formatTime12(appointment.start_time);

        if (newStatus === 'confirmed') {
          await notify({
            user_id : appointment.patient_id,
            type    : 'appointment_confirmed',
            title   : 'Appointment Confirmed',
            message : `Your appointment with Dr. ${appointment.doctor_name} on ${formattedDate} at ${formattedTime} has been confirmed.`,
            metadata: { appointment_id: appointment.id }
          });
        }
        if (newStatus === 'cancelled') {
          // Notify patient
          await notify({
            user_id : appointment.patient_id,
            type    : 'appointment_cancelled',
            title   : 'Appointment Cancelled',
            message : `Your appointment with Dr. ${appointment.doctor_name} on ${formattedDate} has been cancelled by the hospital.`,
            metadata: { appointment_id: appointment.id }
          });
          // Notify doctor
          if (appointment.doctor_profile_id) {
            await notify({
              user_id : appointment.doctor_profile_id,
              type    : 'appointment_cancelled',
              title   : 'Appointment Cancelled by Admin',
              message : `The appointment with ${appointment.patient_name} on ${formattedDate} at ${formattedTime} has been cancelled by admin.`,
              metadata: { appointment_id: appointment.id }
            });
          }
        }
        if (newStatus === 'completed') {
          await notify({
            user_id : appointment.patient_id,
            type    : 'appointment_confirmed',
            title   : 'Appointment Completed',
            message : `Your appointment with Dr. ${appointment.doctor_name} on ${formattedDate} has been marked as completed.`,
            metadata: { appointment_id: appointment.id }
          });
        }
        if (newStatus === 'no_show') {
          await notify({
            user_id : appointment.patient_id,
            type    : 'appointment_no_show',
            title   : 'Missed Appointment',
            message : `You were marked as no-show for your appointment with Dr. ${appointment.doctor_name} on ${formattedDate}.`,
            metadata: { appointment_id: appointment.id }
          });
        }
      }

      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["adminAppointments"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    }
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter((a: any) => 
      a.patient_name?.toLowerCase().includes(q) || 
      a.doctor_name?.toLowerCase().includes(q) ||
      a.department_name?.toLowerCase().includes(q)
    );
  }, [appointments, query]);

  return (
    <div className="flex min-h-screen flex-col bg-background page-fade">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">All Appointments</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage all hospital appointments.</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by patient, doctor, or department..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Update Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0 border-0">
                        <TableSkeleton columns={6} rows={5} />
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10">
                        <EmptyState 
                          title="No appointments match your filters" 
                          description="Try adjusting your search query." 
                          action={
                            query ? (
                              <Button variant="outline" onClick={() => setQuery("")}>
                                Clear Filters
                              </Button>
                            ) : null
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium">{format(parseISO(a.appointment_date), "MMM dd, yyyy")}</div>
                        <div className="text-xs text-muted-foreground">{a.start_time.substring(0, 5)} - {a.end_time.substring(0, 5)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{a.patient_name}</div>
                        {a.patient_phone ? (
                          <a href={`tel:${a.patient_phone}`} className="text-xs text-[#0d766e] hover:underline flex items-center gap-1 mt-0.5">
                            {a.patient_phone}
                          </a>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-0.5">No phone</div>
                        )}
                      </TableCell>
                      <TableCell>{a.doctor_name}</TableCell>
                      <TableCell>{a.department_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize ${statusColors[a.status] || ""}`}>
                          {a.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select 
                          value={a.status} 
                          disabled={statusMutation.isPending}
                          onValueChange={(val) => statusMutation.mutate({ id: a.id, status: val })}
                        >
                          <SelectTrigger className="w-[130px] ml-auto h-8 text-xs">
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="no_show">No Show</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
