import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { DoctorCard } from "@/components/doctor/DoctorCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Stagger } from "@/components/shared/Reveal";
import { getDepartments, getDoctors } from "@/lib/api";

export default function DoctorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const department = searchParams.get("department") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const [query, setQuery] = useState(q ?? "");

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
  });

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return doctors.filter((d) => {
      if (department && d.department_id !== department) return false;
      if (!needle) return true;
      return (
        d.full_name.toLowerCase().includes(needle)
        || d.specialty.toLowerCase().includes(needle)
        || d.department_name.toLowerCase().includes(needle)
      );
    });
  }, [department, query, doctors]);

  function setDepartment(deptId: string | undefined) {
    setSearchParams((prev) => {
      if (deptId) prev.set("department", deptId);
      else prev.delete("department");
      return prev;
    });
  }

  function clearFilters() {
    setQuery("");
    setSearchParams({});
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-fade">
      <Navbar />
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-[#0b1f3a] to-[#0f766e] text-white">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5eead4]">Our specialists</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Find a doctor</h1>
          <p className="mt-3 max-w-xl text-base text-white/70">
            Search by name, specialty, or filter by department to find the right consultant.
          </p>
          <div className="mt-8 flex max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or specialty..."
                className="h-12 pl-11 bg-white/10 border-white/25 text-white placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-[#14b8a6] focus-visible:border-[#14b8a6] transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="mb-8 flex flex-wrap gap-2">
          <Chip active={!department} onClick={() => setDepartment(undefined)}>All</Chip>
          {departments.map((d) => (
            <Chip
              key={d.id}
              active={department === d.id}
              onClick={() => setDepartment(d.id)}
            >
              {d.name}
            </Chip>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-dashed border-border flex justify-between">
                   <Skeleton className="h-4 w-1/4" />
                   <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-10 w-full mt-4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-14 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#14b8a6]/10 text-[#14b8a6] bounce-in">
              <SearchX className="h-9 w-9" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-[#0b1f3a]">No doctors matched</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try a different specialty or clear filters.</p>
            <Button
              variant="outline"
              className="mt-6 border-[#14b8a6] text-[#14b8a6] hover:bg-[#14b8a6] hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <Stagger
            key={`${department ?? "all"}-${query}`}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            step={80}
          >
            {filtered.map((d) => <DoctorCard key={d.doctor_id} doctor={d as any} />)}
          </Stagger>
        )}
      </section>
      <Footer />
    </div>
  );
}

function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        "relative rounded-full border px-4 py-2 text-xs font-medium transition-all duration-300 hover:scale-105 active:scale-95 " +
        (active
          ? "border-[#14b8a6] bg-[#14b8a6] text-white shadow-md shadow-[#14b8a6]/30"
          : "border-border bg-card text-muted-foreground hover:border-[#14b8a6]/60 hover:text-[#0b1f3a] hover:bg-[#14b8a6]/5")
      }
    >
      {children}
    </button>
  );
}
