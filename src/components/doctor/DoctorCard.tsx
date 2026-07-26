import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Database } from "@/types/database";

type Doctor = Database['public']['Views']['doctor_cards']['Row'];

export const DoctorCard = memo(function DoctorCard({ doctor }: { doctor: Doctor }) {
  const initials = doctor.full_name
    .replace(/^Dr\.?\s*/i, "").split(" ").map((s: string) => s[0]).slice(0, 2).join("");

  const optimizedAvatar = doctor.avatar_url?.includes("cloudinary.com") 
    ? doctor.avatar_url.replace("/upload/", "/upload/f_auto,q_auto,w_200/") 
    : doctor.avatar_url;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 hover-tilt hover:border-[#14b8a6]/60">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#14b8a6]/5 blur-3xl transition-opacity duration-500 group-hover:opacity-100 opacity-0" />
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar className="h-16 w-16 rounded-full ring-2 ring-[#14b8a6]/40 transition-all duration-300 group-hover:ring-[#14b8a6] group-hover:pulse-ring">
            <AvatarImage src={optimizedAvatar || ""} alt={doctor.full_name} />
            <AvatarFallback className="rounded-full bg-gradient-to-br from-[#0b1f3a] to-[#14b8a6] text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-[#0b1f3a]">
            {doctor.full_name}
          </h3>
          <p className="truncate text-sm text-muted-foreground">{doctor.specialty}</p>
          <Badge className="mt-1.5 rounded-full bg-[#14b8a6]/10 text-[#0d766e] hover:bg-[#14b8a6]/20 border-0 text-[11px]">
            {doctor.department_name}
          </Badge>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5 text-[#14b8a6]" /> {doctor.experience_yrs}+ yrs</span>
        {doctor.is_visiting && doctor.consultation_fee > 0 ? (
          <span className="font-semibold text-[#0b1f3a]">Rs. {doctor.consultation_fee.toLocaleString()}</span>
        ) : null}
      </div>

      <Button
        asChild
        className="mt-4 w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-95 btn-shimmer"
      >
        <Link to={`/doctors/${doctor.doctor_id}`}>
          View & Book <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
});
