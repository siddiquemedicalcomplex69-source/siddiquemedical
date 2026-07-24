import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Stethoscope, Facebook, Instagram, Twitter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getGlobalSettings } from "@/lib/api";

export function Footer() {
  const { data: settings } = useQuery({
    queryKey: ["globalSettings"],
    queryFn: getGlobalSettings,
  });

  return (
    <footer className="relative bg-[#0b1f3a] text-white/80">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#14b8a6] to-transparent" />
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#14b8a6] text-white shadow-lg">
              <Stethoscope className="h-5 w-5" />
            </span>
            <span className="text-base font-bold text-white">{settings?.hospital_name || "Siddique Medical Complex"}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-white/60 leading-relaxed">
            A trusted multi-specialty hospital delivering compassionate, evidence-based care for every family.
          </p>
          <div className="mt-6 flex items-center gap-3">
            {[
              { Icon: Facebook, label: "Facebook" },
              { Icon: Instagram, label: "Instagram" },
              { Icon: Twitter, label: "Twitter" },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/70 hover:bg-[#14b8a6] hover:text-white hover:border-[#14b8a6] hover:scale-110 transition-all duration-300"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white tracking-wide">Quick Links</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-white/60">
            <li><Link to="/" className="footer-link">Home</Link></li>
            <li><Link to="/doctors" className="footer-link">Find a Doctor</Link></li>
            <li><Link to="/login" className="footer-link">Login</Link></li>
            <li><Link to="/register" className="footer-link">Create Account</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white tracking-wide">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-white/60">
            <li className="flex items-start gap-2.5 hover:text-[#14b8a6] transition-colors">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#14b8a6]" />
              {settings?.address || "12 Jinnah Avenue, Lahore"}
            </li>
            <li className="flex items-center gap-2.5 hover:text-[#14b8a6] transition-colors">
              <Phone className="h-4 w-4 text-[#14b8a6]" /> {settings?.contact_number || "+92 42 1234 5678"}
            </li>
            <li className="flex items-center gap-2.5 hover:text-[#14b8a6] transition-colors">
              <Mail className="h-4 w-4 text-[#14b8a6]" /> {settings?.emergency_email || "care@siddiquemc.example"}
            </li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10 py-5 text-center text-xs text-white/50">
        <div
          className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(20,184,166,0.6),transparent)] bg-[length:200%_100%]"
          style={{ animation: "shimmer 3s linear infinite" }}
        />
        © {new Date().getFullYear()} {settings?.hospital_name || "Siddique Medical Complex"}. All rights reserved.
      </div>
    </footer>
  );
}
