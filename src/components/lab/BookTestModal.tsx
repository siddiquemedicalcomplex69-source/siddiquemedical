import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Info } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notify";
import { bookLabTest } from "@/lib/api";

type Item = { id: string; name: string; code: string; price: number; sample_type?: string | null };

export function BookTestModal({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: Item | null;
}) {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!item) return null;

  const handleConfirm = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const booking = await bookLabTest({
        patient_id: user.id,
        test_id: item.id,
        preferred_date: date,
        status: 'pending'
      });

      const testName = item.name;
      const patientName = user?.full_name || "A patient";

      await notify({
        user_id : user.id,
        type    : 'new_lab_booking',
        title   : 'Lab Test Booking Received',
        message : `Your booking for ${testName} has been received. You will be notified once your sample collection date is set.`,
        metadata: { lab_booking_id: booking.id }
      });

      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      for (const admin of (admins as any[]) ?? []) {
        await notify({
          user_id : admin.id,
          type    : 'new_lab_booking',
          title   : 'New Lab Test Booking',
          message : `${patientName} has booked a ${testName} test. Please review and set a sample collection date.`,
          metadata: { lab_booking_id: booking.id }
        });
      }

      toast.success("Test booked successfully.", {
        description: "You will be notified of your sample collection date soon.",
      });
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Failed to book test.", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[480px] max-h-[85svh] overflow-y-auto top-4 translate-y-0 sm:top-[50%] sm:translate-y-[-50%]">
        <DialogHeader>
          <DialogTitle className="text-[#0b1f3a]">Confirm Lab Test Booking</DialogTitle>
          <DialogDescription>Review details and pick your preferred booking date.</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-[#14b8a6]/20 bg-[#14b8a6]/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-[#0b1f3a]">{item.name}</div>
              <Badge variant="secondary" className="mt-1 text-xs">{item.code}</Badge>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-lg font-bold text-[#14b8a6]">Rs. {item.price.toLocaleString()}</div>
            </div>
          </div>
          {item.sample_type && (
            <div className="mt-2 text-xs text-muted-foreground">Sample type: {item.sample_type}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="booking_date" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#14b8a6]" /> Preferred booking date
          </Label>
          <Input
            id="booking_date"
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="flex gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>You will be notified of your sample collection date after booking. Please bring this booking confirmation when visiting the lab.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={isSubmitting} className="bg-[#14b8a6] hover:bg-[#0d9488] text-white" onClick={handleConfirm}>
            {isSubmitting ? "Booking..." : "Confirm Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
