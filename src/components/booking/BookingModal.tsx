import { useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { formatTime12, type TimeSlot } from "@/lib/slots";
import type { DoctorCard } from "@/types/database";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookAppointment, updateProfile } from "@/lib/api";
import { notify, notifyAdmins } from "@/lib/notify";
import { supabase } from "@/lib/supabase";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  doctor: DoctorCard;
  date: Date;
  slot: TimeSlot;
};

export function BookingModal({ open, onOpenChange, doctor, date, slot }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");

  const mutation = useMutation({
    mutationFn: bookAppointment,
    onSuccess: async (newAppointment) => {
      const formattedDate = format(date, "EEE, d MMM");
      const formattedTime = formatTime12(slot.start_time);
      const doctorName = doctor.full_name;
      const patientName = user!.full_name;

      // Notify patient
      await notify({
        user_id : user!.id,
        type    : 'appointment_booked',
        title   : 'Booking Request Sent',
        message : `Your appointment request with ${doctorName} on ${formattedDate} at ${formattedTime} has been received. Awaiting confirmation.`,
        metadata: { appointment_id: newAppointment.id }
      });

      // Get doctor profile id to notify doctor
      const { data: docData, error: docError } = await supabase.from('doctors').select('profile_id').eq('id', doctor.doctor_id).single();
      const castDocData = docData as any;
      if (docError) {
        toast.error(`Doctor profile fetch failed: ${docError.message}`);
      }

      if (castDocData?.profile_id) {
        await notify({
          user_id : castDocData.profile_id,
          type    : 'new_appointment_request',
          title   : 'New Appointment Request',
          message : `${patientName} has requested an appointment on ${formattedDate} at ${formattedTime}.`,
          metadata: { appointment_id: newAppointment.id }
        });
      }

      // Notify all admins
      await notifyAdmins({
        type    : 'new_appointment_request',
        title   : 'New Appointment Request',
        message : `${patientName} has requested an appointment with ${doctorName} on ${formattedDate}.`,
        metadata: { appointment_id: newAppointment.id }
      });

      toast.success("Booking request sent", {
        description: `Requested ${doctor.full_name} for ${formattedDate} at ${formattedTime}. Pending approval.`,
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['bookedSlots', doctor.doctor_id] });
      navigate("/appointments");
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Could not book this slot.");
    }
  });

  async function handleConfirm() {
    if (!user) {
      onOpenChange(false);
      navigate(`/login?redirectTo=/doctors/${doctor.doctor_id}`);
      return;
    }
    mutation.mutate({
      patient_id: user.id,
      doctor_id: doctor.doctor_id,
      appointment_date: format(date, "yyyy-MM-dd"),
      start_time: slot.start_time,
      end_time: slot.end_time,
      reason: reason.trim() || null,
      notes: null,
      status: "pending",
      fee_charged: doctor.consultation_fee,
    });
    
    if (phone.trim() && phone.trim() !== user.phone) {
      updateProfile(user.id, { phone: phone.trim() }).catch(err => {
        console.error("Failed to update profile phone", err);
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-[500px] max-h-[85svh] overflow-y-auto top-4 translate-y-0 sm:top-[50%] sm:translate-y-[-50%]">
        <DialogHeader>
          <DialogTitle>Confirm your appointment</DialogTitle>
          <DialogDescription>Review the details before confirming.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 rounded-lg border border-border bg-surface p-4 text-sm">
          <Row label="Doctor" value={doctor.full_name} />
          <Row label="Specialty" value={doctor.specialty} />
          <Row label="Date" value={format(date, "EEEE, d MMMM yyyy")} />
          <Row label="Time" value={`${formatTime12(slot.start_time)} – ${formatTime12(slot.end_time)}`} />
          {doctor.is_visiting && doctor.consultation_fee > 0 && <Row label="Fee" value={`Rs. ${doctor.consultation_fee.toLocaleString()}`} highlight />}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone / WhatsApp Number</Label>
          <Input
            id="phone" value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0300 1234567"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reason">Reason for visit (optional)</Label>
          <Textarea
            id="reason" rows={3} value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 500))}
            placeholder="e.g. Follow up on blood pressure medication"
          />
        </div>
        {!user && (
          <p className="rounded-md border border-border bg-accent/40 px-3 py-2 text-xs text-accent-foreground">
            You'll be asked to sign in to complete this booking.
          </p>
        )}
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={mutation.isPending}>
            {mutation.isPending ? "Booking..." : user ? "Confirm Booking" : "Sign in to book"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-semibold text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}
