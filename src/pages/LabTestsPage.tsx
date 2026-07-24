import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Search, FlaskConical, Clock, Smartphone, Building2, FileText, X } from "lucide-react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Reveal, Stagger } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookTestModal } from "@/components/lab/BookTestModal";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getLabCategories, getLabTests } from "@/lib/api";
import type { LabTest, LabTestCategory } from "@/types/database";

type BookItem = { id: string; name: string; code: string; price: number; sample_type?: string | null };

function LabTestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<BookItem | null>(null);

  const { data: mockCategories = [] as LabTestCategory[] } = useQuery<LabTestCategory[]>({
    queryKey: ['labCategories'],
    queryFn: getLabCategories as any
  });

  const { data: allTests = [] as LabTest[] } = useQuery<LabTest[]>({
    queryKey: ['labTests'],
    queryFn: getLabTests as any
  });

  const tests = useMemo(() => {
    const query = q.trim().toLowerCase();
    return allTests.filter((t) => t.is_active
      && (cat === "all" || t.category_id === cat)
      && (!query || t.name.toLowerCase().includes(query) || t.code.toLowerCase().includes(query)));
  }, [q, cat, allTests]);

  const openBook = (b: BookItem) => {
    if (!user) {
      navigate("/login?redirectTo=/lab-tests");
      return;
    }
    setItem(b);
    setOpen(true);
  };

  return (
    <div className="min-h-screen animate-fade-in">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1f3a] via-[#0e2a4d] to-[#14b8a6] text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
          <Reveal>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/70">
              <FlaskConical className="h-4 w-4" /> Diagnostics
            </div>
            <h1 className="mt-3 text-4xl sm:text-5xl font-bold font-[Sora] tracking-tight">
              Lab Tests & Diagnostics
            </h1>
            <p className="mt-3 max-w-2xl text-white/80">
              Browse our available tests and book online. Visit us to give your sample and collect your report.
            </p>
          </Reveal>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10">
        {/* Search */}
        <Reveal>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by test name or code e.g. CBC, Thyroid..."
              className="h-14 pl-12 text-base rounded-2xl border-2 focus-visible:border-[#14b8a6] focus-visible:ring-[#14b8a6]/20"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </Reveal>

        {/* Category tabs */}
        <Reveal delay={80}>
          <div className="mt-6 -mx-4 px-4 overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-2">
              <CategoryChip active={cat === "all"} onClick={() => setCat("all")}>All</CategoryChip>
              {mockCategories.map((c) => (
                <CategoryChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
                  <span className="mr-1.5">{c.icon}</span>{c.name}
                </CategoryChip>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Tests grid */}
        {tests.length === 0 ? (
          <Reveal>
            <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
              <p className="text-muted-foreground">No tests found for your search.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setQ(""); setCat("all"); }}>
                Clear Search
              </Button>
            </div>
          </Reveal>
        ) : (
          <Stagger className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tests.map((t) => (
              <Card key={t.id} className="group border-2 hover:border-[#14b8a6]/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-5 flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[#0b1f3a] leading-snug">{t.name}</h3>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">{t.code}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      {t.sample_type === "Blood" ? "🩸" : t.sample_type === "Urine" ? "🧪" : "🧫"} {t.sample_type}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Results in ~{t.turnaround_hours}h
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                  <div className="mt-4 flex items-end justify-between">
                    <div className="text-2xl font-bold text-[#14b8a6]">Rs. {t.price.toLocaleString()}</div>
                  </div>
                  <Button
                    onClick={() => openBook({ id: t.id, name: t.name, code: t.code, price: t.price, sample_type: t.sample_type })}
                    className="mt-4 w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white"
                  >
                    Book Test
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stagger>
        )}

        {/* How it works */}
        <Reveal>
          <div className="mt-16 rounded-3xl border bg-gradient-to-r from-[#0b1f3a]/5 to-[#14b8a6]/10 p-8">
            <h3 className="text-center text-sm font-semibold uppercase tracking-widest text-[#0b1f3a]/70">How it works</h3>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              <Step icon={<Smartphone className="h-5 w-5" />} title="Book Online" body="Choose a test and confirm your preferred date." />
              <Step icon={<Building2 className="h-5 w-5" />} title="Visit Lab to Give Sample" body="Come to the hospital on the date we confirm." />
              <Step icon={<FileText className="h-5 w-5" />} title="Collect Your Report in Person" body="Pick up your report from the lab counter." />
            </div>
          </div>
        </Reveal>

        {/* Packages Removed */}
      </main>

      <Footer />
      <BookTestModal open={open} onOpenChange={setOpen} item={item} />
    </div>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all",
        active
          ? "bg-[#14b8a6] text-white border-[#14b8a6] shadow-md"
          : "bg-white text-[#0b1f3a] border-border hover:border-[#14b8a6]/50",
      )}
    >
      {children}
    </button>
  );
}


function Step({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#14b8a6] text-white shadow">{icon}</div>
      <div>
        <div className="font-semibold text-[#0b1f3a]">{title}</div>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

export default LabTestsPage;

