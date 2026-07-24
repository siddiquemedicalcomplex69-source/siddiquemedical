import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowRight, CalendarCheck, Search, ShieldCheck, Stethoscope, Activity,
  HeartPulse, Brain, Bone, Baby, Sparkles, Flower2, Ear, Eye, Smile,
  Users, Clock, Award, Shield, ChevronLeft, ChevronRight, Star, Quote,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { DoctorCard } from "@/components/doctor/DoctorCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal, Stagger } from "@/components/shared/Reveal";
import { useInView } from "@/hooks/useInView";
import { getDepartments, getDoctors } from "@/lib/api";

const ICONS: Record<string, LucideIcon> = {
  HeartPulse, Brain, Bone, Baby, Sparkles, Flower2, Ear, Eye, Stethoscope, Smile, Activity
};

const SLIDES = [
  {
    img: "https://picsum.photos/1600/900?random=10",
    kicker: "Trusted since 1998",
    title: "Expert care,",
    accent: "when you need it most.",
    subtitle: "World-class specialists, modern facilities, and appointments that fit your day.",
    cta: "Book an Appointment",
  },
  {
    img: "https://picsum.photos/1600/900?random=11",
    kicker: "Emergency care 24/7",
    title: "Emergency ready,",
    accent: "always by your side.",
    subtitle: "Round-the-clock emergency services staffed by senior consultants and rapid response teams.",
    cta: "Learn More",
  },
  {
    img: "https://picsum.photos/1600/900?random=12",
    kicker: "10 specialties. One roof.",
    title: "Trusted specialists,",
    accent: "compassionate teams.",
    subtitle: "From cardiology to pediatrics — meet consultants who genuinely listen.",
    cta: "Meet Our Doctors",
  },
];

export default function HomePage() {
  const { data: departments = [], isLoading: isLoadingDept } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  const { data: doctors = [], isLoading: isLoadingDocs } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
  });

  const featured = doctors.slice(0, 6);

  return (
    <div className="flex min-h-screen flex-col bg-background page-fade">
      <Navbar />
      <Hero />
      <StatsStrip />
      <HowItWorks />
      <Departments departments={departments} isLoading={isLoadingDept} />
      <FeaturedDoctors doctors={featured} isLoading={isLoadingDocs} />
      <WhyChooseUs />
      <Testimonials />
      <Footer />
    </div>
  );
}

/* -------------------- HERO CAROUSEL -------------------- */
function Hero() {
  const [i, setI] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % SLIDES.length), 5500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const s = SLIDES[i];
  return (
    <section className="relative isolate min-h-[92vh] w-full overflow-hidden bg-[#0b1f3a] text-white">
      {SLIDES.map((slide, idx) => (
        <div
          key={idx}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            opacity: idx === i ? 1 : 0,
            backgroundImage: `url(${slide.img})`,
            backgroundSize: "cover",
            backgroundPosition: `center ${50 + scrollY * 0.05}%`,
            transform: `translateY(${scrollY * 0.3}px)`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b1f3a]/90 via-[#0b1f3a]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f3a]/70 via-transparent to-transparent" />

      <div className="relative mx-auto flex min-h-[92vh] w-full max-w-7xl flex-col justify-center px-4 py-24">
        <div key={i} className="max-w-2xl">
          <span
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-3 py-1 text-xs backdrop-blur-md slide-in-left"
            style={{ animationDelay: "0ms" }}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#14b8a6]" />
            {s.kicker}
          </span>
          <h1
            className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl slide-in-left"
            style={{ animationDelay: "80ms" }}
          >
            {s.title}
            <br />
            <span className="bg-gradient-to-r from-[#14b8a6] to-[#5eead4] bg-clip-text text-transparent">
              {s.accent}
            </span>
          </h1>
          <p
            className="mt-6 max-w-lg text-lg text-white/80 fade-up"
            style={{ animationDelay: "260ms" }}
          >{s.subtitle}</p>
          <div className="mt-10 flex flex-wrap gap-3 fade-up" style={{ animationDelay: "440ms" }}>
            <Button
              asChild
              size="lg"
              className="bg-[#14b8a6] hover:bg-[#0d9488] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 btn-shimmer h-12 px-7 text-base"
            >
              <Link to="/doctors">{s.cta} <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-7 text-base border-white/40 bg-white/5 text-white backdrop-blur hover:bg-white hover:text-[#0b1f3a] hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <Link to="/doctors">Browse Doctors</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={() => setI((x) => (x - 1 + SLIDES.length) % SLIDES.length)}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white hover:text-[#0b1f3a] hover:scale-110 transition-all duration-300 md:left-8"
      ><ChevronLeft className="h-5 w-5" /></button>
      <button
        onClick={() => setI((x) => (x + 1) % SLIDES.length)}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white hover:text-[#0b1f3a] hover:scale-110 transition-all duration-300 md:right-8"
      ><ChevronRight className="h-5 w-5" /></button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={
              "h-2 rounded-full transition-all duration-300 " +
              (idx === i ? "w-10 bg-[#14b8a6]" : "w-2 bg-white/40 hover:bg-white/70")
            }
          />
        ))}
      </div>
    </section>
  );
}

/* -------------------- STATS STRIP w/ count-up -------------------- */
function CountUp({ end, suffix = "" }: { end: number; suffix?: string }) {
  const { ref, inView } = useInView(0.4);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const dur = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, end]);
  return <span ref={ref as never}>{n}{suffix}</span>;
}

function StatsStrip() {
  const stats = [
    { n: 30, suffix: "+", label: "Specialists", Icon: Users },
    { n: 10, suffix: "", label: "Departments", Icon: Stethoscope },
    { n: 24, suffix: "/7", label: "Emergency", Icon: Clock },
    { n: 1000, suffix: "+", label: "Patients Served", Icon: Award },
  ];
  return (
    <section className="relative border-y border-border bg-surface dot-grid py-14">
      <div className="mx-auto w-full max-w-7xl px-4">
        <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-4" step={100}>
          {stats.map((s) => (
            <div
              key={s.label}
              className="hover-tilt rounded-2xl border border-border bg-card p-6 text-center"
            >
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#14b8a6]/10 text-[#14b8a6] float-y">
                <s.Icon className="h-6 w-6" />
              </div>
              <div className="mt-4 text-4xl font-bold text-[#0b1f3a]">
                <CountUp end={s.n} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* -------------------- HOW IT WORKS -------------------- */
function HowItWorks() {
  const steps = [
    { icon: Search, title: "Find a doctor", desc: "Search by name, specialty, or department." },
    { icon: CalendarCheck, title: "Choose a slot", desc: "See real-time availability and pick a time." },
    { icon: ShieldCheck, title: "Confirm booking", desc: "Instant confirmation, managed from your dashboard." },
  ];
  return (
    <section className="border-b border-border py-20">
      <div className="mx-auto w-full max-w-7xl px-4">
        <Reveal className="mb-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#14b8a6]">Simple &amp; fast</p>
          <h2 className="mt-3 text-4xl font-bold text-[#0b1f3a] md:text-5xl">How it works</h2>
          <p className="mt-3 text-base text-muted-foreground">Three simple steps to see a doctor.</p>
        </Reveal>
        <div className="relative">
          <div className="pointer-events-none absolute left-[12%] right-[12%] top-[40px] hidden border-t-2 border-dashed border-[#14b8a6]/30 md:block" />
          <Stagger className="relative grid gap-8 md:grid-cols-3" step={120}>
            {steps.map((s, i) => (
              <div key={s.title} className="group text-center">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white ring-2 ring-[#14b8a6] text-[#14b8a6] transition-all duration-300 group-hover:pulse-ring group-hover:bg-[#14b8a6] group-hover:text-white">
                  <s.icon className="h-8 w-8 transition-transform duration-500 group-hover:[transform:rotateY(360deg)]" />
                </div>
                <div className="mt-2 text-xs font-bold uppercase tracking-widest text-[#14b8a6]">Step {i + 1}</div>
                <h3 className="mt-2 text-xl font-bold text-[#0b1f3a]">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

/* -------------------- DEPARTMENTS -------------------- */
function Departments({ departments, isLoading }: { departments: any[], isLoading: boolean }) {
  return (
    <section className="border-b border-border bg-surface py-20">
      <div className="mx-auto w-full max-w-7xl px-4">
        <Reveal className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#14b8a6]">Comprehensive care</p>
          <h2 className="mt-3 text-4xl font-bold text-[#0b1f3a] md:text-5xl">Our departments</h2>
        </Reveal>
        
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5">
                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">No departments found.</div>
        ) : (
          <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" step={70}>
            {departments.map((d) => {
              const Icon = ICONS[d.icon] ?? Stethoscope;
              return (
                <Link
                  key={d.id}
                  to={`/doctors?department=${d.id}`}
                  className="group hover-tilt rounded-2xl border border-border bg-card p-5 hover:border-[#14b8a6]"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#14b8a6]/10 text-[#14b8a6] transition-all duration-500 group-hover:bg-[#14b8a6] group-hover:text-white group-hover:[transform:rotateY(360deg)]">
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="mt-4 text-sm font-bold text-[#0b1f3a]">{d.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{d.description}</p>
                </Link>
              );
            })}
          </Stagger>
        )}
      </div>
    </section>
  );
}

/* -------------------- FEATURED DOCTORS -------------------- */
function FeaturedDoctors({ doctors, isLoading }: { doctors: any[], isLoading: boolean }) {
  return (
    <section className="border-b border-border py-20">
      <div className="mx-auto w-full max-w-7xl px-4">
        <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#14b8a6]">Meet the team</p>
            <h2 className="mt-3 text-4xl font-bold text-[#0b1f3a] md:text-5xl">Our specialists</h2>
          </div>
          <Button asChild variant="ghost" className="text-[#14b8a6] hover:text-[#0d9488] hover:bg-[#14b8a6]/10">
            <Link to="/doctors">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </Reveal>
        
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {Array.from({ length: 3 }).map((_, i) => (
               <div key={i} className="rounded-2xl border border-border bg-card p-6">
                 <div className="flex gap-4">
                   <Skeleton className="h-16 w-16 rounded-full" />
                   <div className="flex-1">
                     <Skeleton className="h-5 w-3/4 mb-2" />
                     <Skeleton className="h-4 w-1/2 mb-2" />
                     <Skeleton className="h-4 w-1/3" />
                   </div>
                 </div>
               </div>
             ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">No specialists found.</div>
        ) : (
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" step={90}>
            {doctors.map((d) => <DoctorCard key={d.doctor_id} doctor={d as any} />)}
          </Stagger>
        )}
      </div>
    </section>
  );
}

/* -------------------- WHY CHOOSE US -------------------- */
function WhyChooseUs() {
  const items = [
    { Icon: Award, title: "Board-certified experts", desc: "Every consultant is rigorously credentialed and continuously trained." },
    { Icon: Shield, title: "Patient-first care", desc: "Transparent pricing, no hidden fees, and a promise to listen." },
    { Icon: Clock, title: "24/7 emergency", desc: "Round-the-clock emergency service with rapid response teams." },
    { Icon: HeartPulse, title: "Modern facilities", desc: "State-of-the-art diagnostics, imaging and operating theatres." },
  ];
  return (
    <section className="border-b border-border bg-surface py-20">
      <div className="mx-auto w-full max-w-7xl px-4">
        <Reveal className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#14b8a6]">Why patients choose us</p>
          <h2 className="mt-3 text-4xl font-bold text-[#0b1f3a] md:text-5xl">Care you can trust</h2>
        </Reveal>
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" step={90}>
          {items.map((x) => (
            <div
              key={x.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 hover-lift hover:border-[#14b8a6]"
            >
              <div className="absolute left-0 top-0 h-full w-0 bg-[#14b8a6] transition-all duration-500 group-hover:w-1" />
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#14b8a6]/10 text-[#14b8a6] shadow-sm transition-all duration-300 group-hover:teal-ring">
                <x.Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#0b1f3a]">{x.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{x.desc}</p>
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* -------------------- TESTIMONIALS -------------------- */
function Testimonials() {
  const items = [
    { name: "Ayaan R.", role: "Patient, Cardiology", text: "The consultant genuinely listened. Booking online saved me so much time." },
    { name: "Fatima K.", role: "Parent, Pediatrics", text: "Warm, patient staff who made my daughter feel safe. Highly recommend." },
    { name: "Umar S.", role: "Patient, Orthopedics", text: "Modern facility, clear communication and a smooth recovery journey." },
  ];
  return (
    <section className="py-20">
      <div className="mx-auto w-full max-w-7xl px-4">
        <Reveal className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#14b8a6]">Patient stories</p>
          <h2 className="mt-3 text-4xl font-bold text-[#0b1f3a] md:text-5xl">What our patients say</h2>
        </Reveal>
        <Stagger className="grid gap-6 md:grid-cols-3" step={120}>
          {items.map((t, idx) => (
            <TestimonialCard key={t.name} {...t} idx={idx} />
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function TestimonialCard({ name, role, text, idx }: { name: string; role: string; text: string; idx: number }) {
  const { ref, inView } = useInView(0.3);
  return (
    <div
      ref={ref as never}
      className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-white to-[#14b8a6]/5 p-8 hover-lift hover:border-[#14b8a6]"
    >
      <Quote className="absolute -top-2 -right-2 h-24 w-24 text-[#14b8a6]/10" strokeWidth={1} />
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            className={
              "h-4 w-4 fill-[#f59e0b] text-[#f59e0b] transition-all duration-300 " +
              (inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")
            }
            style={{ transitionDelay: `${idx * 100 + i * 80}ms` }}
          />
        ))}
      </div>
      <p className="mt-4 text-base text-[#0b1f3a]/90 leading-relaxed relative z-10">"{text}"</p>
      <div className="mt-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#0b1f3a] to-[#14b8a6] text-white text-sm font-bold">
          {name.split(" ").map((s) => s[0]).join("")}
        </div>
        <div>
          <div className="text-sm font-bold text-[#0b1f3a]">{name}</div>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
      </div>
    </div>
  );
}
