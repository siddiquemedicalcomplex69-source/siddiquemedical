import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Award, Briefcase, Languages, Wallet } from "lucide-react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SlotPicker } from "@/components/booking/SlotPicker";
import { BookingModal } from "@/components/booking/BookingModal";
import { Skeleton } from "@/components/ui/skeleton";
import { getDoctorById, getGlobalSettings } from "@/lib/api";
import type { TimeSlot } from "@/lib/slots";
import { useAuth } from "@/lib/auth";

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => getDoctorById(id!),
    enabled: !!id,
  });

  const { data: settings } = useQuery({
    queryKey: ["globalSettings"],
    queryFn: getGlobalSettings,
    staleTime: 1000 * 60 * 5,
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<{ date: Date; slot: TimeSlot } | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background page-fade">
        <Navbar />
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
          <Skeleton className="h-8 w-32" />
        </div>
        <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6 slide-in-left">
            <Card className="overflow-hidden border-border">
              <CardContent className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 md:flex-row md:items-start">
                <Skeleton className="h-28 w-28 rounded-full shrink-0" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-24 w-full" />
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6 slide-in-right">
            <Card className="border-border">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-40 mb-4" />
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // Not found state
  if (!doctor) {
    return (
      <div className="flex min-h-screen flex-col bg-background page-fade">
        <Navbar />
        <div className="mx-auto flex flex-1 items-center justify-center px-4 py-20 text-center">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Doctor not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">This profile may have been moved or is no longer available.</p>
            <Button asChild className="mt-6 border-[#14b8a6] text-[#14b8a6] hover:bg-[#14b8a6] hover:text-white"><Link to="/doctors">Browse all doctors</Link></Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const initials = doctor.full_name.replace(/^Dr\.?\s*/i, "").split(" ").map((s: string) => s[0]).slice(0, 2).join("");
  const pills = [doctor.specialty, doctor.department_name, ...(doctor.languages || [])];

  function handleSelect(date: Date, slot: TimeSlot) {
    if (!user) {
      navigate(`/login?redirectTo=/doctors/${doctor!.doctor_id}`);
      return;
    }
    setPicked({ date, slot });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-fade">
      <Navbar />
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-[#0b1f3a] hover:text-[#14b8a6]">
          <Link to="/doctors"><ArrowLeft className="mr-1 h-4 w-4" /> Back to doctors</Link>
        </Button>
      </div>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6 slide-in-left min-w-0 w-full">
          <Card className="overflow-hidden border-border hover-lift">
            <CardContent className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 md:flex-row md:items-start">
              <Avatar className="h-28 w-28 rounded-full ring-4 ring-[#14b8a6]/40 pulse-ring shrink-0">
                <AvatarImage src={doctor.avatar_url || undefined} alt={doctor.full_name} />
                <AvatarFallback className="rounded-full bg-gradient-to-br from-[#0b1f3a] to-[#14b8a6] text-white text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold text-[#0b1f3a]">{doctor.full_name}</h1>
                </div>
                <p className="mt-1 text-base text-[#14b8a6] font-medium">{doctor.specialty}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {pills.map((p, i) => p && (
                    <Badge
                      key={p}
                      variant="secondary"
                      className="h-auto whitespace-normal text-left rounded-full bg-[#14b8a6]/10 text-[#0d766e] hover:bg-[#14b8a6]/20 border-0 fade-up"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      {p}
                    </Badge>
                  ))}
                </div>
                <p className="mt-5 text-sm leading-relaxed text-foreground/80">{doctor.bio}</p>
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <Info icon={Award} label="Qualification" value={doctor.qualification || ""} />
                  <Info icon={Briefcase} label="Experience" value={`${doctor.experience_yrs} years`} />
                  <Info icon={Languages} label="Languages" value={doctor.languages?.join(", ") || ""} />
                  {doctor.is_visiting && doctor.consultation_fee > 0 && <Info icon={Wallet} label="Fee" value={`Rs. ${doctor.consultation_fee.toLocaleString()}`} />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border overflow-hidden">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <h2 className="text-xl font-bold text-[#0b1f3a]">Book an appointment</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Select a date and pick from available time slots.
              </p>
              <div className="mt-6 w-full min-w-0">
                <SlotPicker
                  doctorId={doctor.doctor_id}
                  slotDurationMin={doctor.slot_duration_min}
                  onSelect={handleSelect}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 slide-in-right min-w-0 w-full">
          <Card className="border-border hover-lift overflow-hidden">
            {doctor.is_visiting && doctor.consultation_fee > 0 && (
            <div className="bg-gradient-to-br from-[#0b1f3a] to-[#14b8a6] p-6 text-white">
              <p className="text-xs uppercase tracking-widest text-white/70">Consultation</p>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Consultation Fee</p>
                <p className="text-xl font-bold text-[#0b1f3a]">Rs. {doctor.consultation_fee.toLocaleString()}</p>
              </div>
            </div>
            )}
            <CardContent className="p-6">
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#14b8a6]" /> {doctor.slot_duration_min}-minute consultation</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#14b8a6]" /> On-site at {settings?.hospital_name || "Siddique Medical Complex"}</li>
              </ul>
              {!user && (
                <Button
                  asChild
                  className="mt-5 w-full bg-[#14b8a6] hover:bg-[#0d9488] btn-shimmer hover:scale-[1.02] active:scale-95 transition-all duration-300 text-white"
                >
                  <Link to={`/login?redirectTo=/doctors/${doctor.doctor_id}`}>
                    Sign in to book
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>
      </section>

      {picked && (
        <BookingModal
          open={!!picked}
          onOpenChange={(v) => !v && setPicked(null)}
          doctor={doctor as any}
          date={picked.date}
          slot={picked.slot}
        />
      )}
      <Footer />
    </div>
  );
}

function Info({
  icon: Icon, label, value,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-border bg-surface/50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-[#14b8a6]" /> {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-[#0b1f3a]">{value}</p>
    </div>
  );
}
