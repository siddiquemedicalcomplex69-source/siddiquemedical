import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { FlaskConical, CalendarDays, FileText, Hourglass, XCircle, Loader2 } from "lucide-react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Reveal, Stagger } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPatientLabBookings, updateLabBooking } from "@/lib/api";
import { statusLabel, statusClass, type LabBookingDetail } from "@/types/database";



function fmt(d: string | null) {
  if (!d) return "";
  try { return format(parseISO(d), "d MMM yyyy"); } catch { return d; }
}

function MyTestsPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: items = [] as LabBookingDetail[] } = useQuery<LabBookingDetail[]>({
    queryKey: ['patientLabBookings', user?.id],
    queryFn: () => getPatientLabBookings(user!.id) as any,
    enabled: !!user
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => updateLabBooking(id, { status: "cancelled" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientLabBookings'] });
      toast.success("Test booking cancelled");
    }
  });

  useEffect(() => {
    if (ready && !user) navigate("/login?redirectTo=/my-tests");
  }, [ready, user, navigate]);

  const cancel = (id: string) => {
    cancelMutation.mutate(id);
  };

  return (
    <div className="min-h-screen animate-fade-in">
      <Navbar />

      <section className="bg-gradient-to-br from-[#0b1f3a] via-[#0e2a4d] to-[#14b8a6] text-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <Reveal>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/70">
              <FlaskConical className="h-4 w-4" /> Patient Portal
            </div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold font-[Sora]">My Lab Tests</h1>
            <p className="mt-2 text-white/80">Track your bookings and important dates set by our lab team.</p>
          </Reveal>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {items.length === 0 ? (
          <Reveal>
            <div className="rounded-2xl border border-dashed p-12 text-center">
              <p className="text-muted-foreground">No lab tests booked yet.</p>
              <Button asChild className="mt-4 bg-[#14b8a6] hover:bg-[#0d9488] text-white">
                <Link to="/lab-tests">Browse Lab Tests</Link>
              </Button>
            </div>
          </Reveal>
        ) : (
          <Stagger className="grid grid-cols-1 gap-4">
            {items.map((t) => (
              <Card key={t.id} className="border-2 hover:shadow-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#0b1f3a]">{t.test_name}</h3>
                        <Badge variant="secondary" className="text-[10px]">{t.test_code}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Booked on {fmt(t.booking_date)} • Rs. {(t.price ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <Badge className={cn("border", statusClass[t.status], t.status === "pending" && "animate-pulse")}>
                      {statusLabel[t.status]}
                    </Badge>
                  </div>

                  {t.status === "pending" && (
                    <InfoBox tone="grey" icon={<Hourglass className="h-4 w-4" />}>
                      Your booking is under review. You will be notified once your sample collection date is set.
                    </InfoBox>
                  )}
                  {(t.status === "sample_date_set" || t.status === "report_date_set" || t.status === "completed") && t.sample_collection_date && (
                    <InfoBox tone="teal" icon={<CalendarDays className="h-4 w-4" />}>
                      Please visit the lab on <strong>{fmt(t.sample_collection_date)}</strong> to give your sample. Bring this booking confirmation.
                    </InfoBox>
                  )}
                  {(t.status === "report_date_set" || t.status === "completed") && t.report_collection_date && (
                    <InfoBox tone="navy" icon={<FileText className="h-4 w-4" />}>
                      Your report will be ready for collection on <strong>{fmt(t.report_collection_date)}</strong>. Please visit the lab to collect in person.
                    </InfoBox>
                  )}

                  {t.status === "pending" && (
                    <div className="mt-4 flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={cancelMutation.isPending && cancelMutation.variables === t.id}
                        onClick={() => cancel(t.id)}
                      >
                        {cancelMutation.isPending && cancelMutation.variables === t.id ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-1.5 h-4 w-4" />
                        )}
                        {cancelMutation.isPending && cancelMutation.variables === t.id ? "Cancelling..." : "Cancel booking"}
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

function InfoBox({ tone, icon, children }: { tone: "grey" | "teal" | "navy"; icon: React.ReactNode; children: React.ReactNode }) {
  const styles = {
    grey: "bg-slate-50 border-slate-200 text-slate-700",
    teal: "bg-[#14b8a6]/10 border-[#14b8a6]/30 text-[#0f766e]",
    navy: "bg-[#0b1f3a]/5 border-[#0b1f3a]/20 text-[#0b1f3a]",
  } as const;
  return (
    <div className={cn("mt-4 flex items-start gap-2 rounded-lg border p-3 text-sm", styles[tone])}>
      <span className="mt-0.5">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

export default MyTestsPage;
