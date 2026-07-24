import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Stethoscope, ShieldCheck, HeartPulse, Sparkles } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
}: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background page-fade lg:grid-cols-2">
      {/* Left panel */}
      <div className="relative hidden overflow-hidden animated-gradient text-white lg:flex lg:flex-col lg:justify-between p-12">
        <div className="pointer-events-none absolute inset-0 opacity-20 dot-grid" />
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl float-y" />
        <div
          className="pointer-events-none absolute bottom-10 left-10 h-72 w-72 rounded-full bg-[#14b8a6]/30 blur-3xl float-y"
          style={{ animationDelay: "1.5s" }}
        />

        <Link to="/" className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur ring-1 ring-white/30">
            <Stethoscope className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold">Siddique Medical Complex</span>
        </Link>

        <div className="relative">
          <h2 className="text-5xl font-bold leading-[1.05]">
            Expert care,
            <br />
            <span className="text-[#5eead4]">easy booking.</span>
          </h2>
          <p className="mt-4 max-w-md text-base text-white/80">
            Reserve appointments with trusted specialists — anytime, from anywhere.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              { Icon: ShieldCheck, text: "Board-certified consultants" },
              { Icon: HeartPulse, text: "24/7 emergency service" },
              { Icon: Sparkles, text: "Modern, patient-first facilities" },
            ].map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 ring-1 ring-white/20">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} Siddique Medical Complex
        </p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#0b1f3a] to-[#14b8a6] text-white">
              <Stethoscope className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold text-[#0b1f3a]">Siddique Medical Complex</span>
          </Link>
          <div className="fade-up">
            <h1 className="text-3xl font-bold text-[#0b1f3a]">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="mt-8 fade-up" style={{ animationDelay: "120ms" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
