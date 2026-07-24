import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, FlaskConical } from "lucide-react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Reveal, Stagger } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLabCategories, getLabTests } from "@/lib/api";
import type { LabTest, LabTestCategory } from "@/types/database";

const testSchema = z.object({
  name: z.string().min(2, "Name required"),
  code: z.string().min(2, "Code required"),
  category_id: z.string().min(1, "Category required"),
  price: z.coerce.number().min(0),
  sample_type: z.enum(["Blood", "Urine", "Stool", "Swab", "Semen", "Fluid"]),
  turnaround_hours: z.coerce.number().min(0),
  description: z.string().optional(),
});
type TestForm = z.infer<typeof testSchema>;



function AdminTestsPage() {
  const { data: tests = [] as LabTest[] } = useQuery<LabTest[]>({
    queryKey: ['labTests'],
    queryFn: getLabTests as any
  });

  const { data: categories = [] as LabTestCategory[] } = useQuery<LabTestCategory[]>({
    queryKey: ['labCategories'],
    queryFn: getLabCategories as any
  });

  return (
    <div className="min-h-screen animate-fade-in">
      <Navbar />

      <section className="bg-gradient-to-br from-[#0b1f3a] via-[#0e2a4d] to-[#14b8a6] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <Reveal>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/70">
              <FlaskConical className="h-4 w-4" /> Admin
            </div>
            <p className="mt-1 text-white/80">Manage the lab catalogue.</p>
          </Reveal>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <TestsTab tests={tests} categories={categories} />
      </main>

      <Footer />
    </div>
  );
}

function TestsTab({ tests, categories }: { tests: LabTest[], categories: LabTestCategory[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LabTest | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return tests.filter((t) => !query || t.name.toLowerCase().includes(query) || t.code.toLowerCase().includes(query));
  }, [tests, q]);

  const toggleActive = (id: string) => {
    // Implement API call
    toast.success("Toggled test status");
  };

  const openAdd = () => { setEditing(null); setOpen(true); };
  const openEdit = (t: LabTest) => { setEditing(t); setOpen(true); };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or code..." className="pl-9" />
        </div>
        <Button onClick={openAdd} className="bg-[#14b8a6] hover:bg-[#0d9488] text-white">
          <Plus className="mr-1.5 h-4 w-4" /> Add Test
        </Button>
      </div>

      <Card className="mt-4">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sample</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Turnaround</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  No tests found. <Button variant="link" onClick={openAdd}>Add Test</Button>
                </TableCell></TableRow>
              )}
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-[#0b1f3a]">{t.name}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{t.code}</Badge></TableCell>
                  <TableCell>{categories.find((c) => c.id === t.category_id)?.name ?? "—"}</TableCell>
                  <TableCell>{t.sample_type}</TableCell>
                  <TableCell className="text-[#14b8a6] font-semibold">Rs. {t.price.toLocaleString()}</TableCell>
                  <TableCell>{t.turnaround_hours}h</TableCell>
                  <TableCell>
                    <Switch checked={t.is_active} onCheckedChange={() => toggleActive(t.id)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                      <Pencil className="mr-1 h-4 w-4" /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

        <TestFormDialog open={open} onOpenChange={setOpen} initial={editing} categories={categories} onSubmit={async (data) => {
          // Implement API call for Add/Edit
          toast.success("Test saved");
          setOpen(false);
        }} />
    </>
  );
}

function TestFormDialog({
  open, onOpenChange, initial, categories, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: LabTest | null;
  categories: LabTestCategory[];
  onSubmit: (v: TestForm) => void;
}) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<TestForm>({
    resolver: zodResolver(testSchema),
    values: initial ? { name: initial.name, code: initial.code, category_id: initial.category_id, price: initial.price, sample_type: initial.sample_type as any, turnaround_hours: initial.turnaround_hours, description: initial.description || undefined } : { name: "", code: "", category_id: "", price: 0, sample_type: "Blood", turnaround_hours: 24, description: "" },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader><DialogTitle>{initial ? "Edit Test" : "Add Test"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Test name" error={errors.name?.message}><Input {...register("name")} /></Field>
            <Field label="Test code" error={errors.code?.message}><Input {...register("code")} /></Field>
            <Field label="Category" error={errors.category_id?.message}>
              <Select value={watch("category_id")} onValueChange={(v) => setValue("category_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Sample type" error={errors.sample_type?.message}>
              <Select value={watch("sample_type")} onValueChange={(v) => setValue("sample_type", v as TestForm["sample_type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Blood", "Urine", "Stool", "Swab"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Price (PKR)" error={errors.price?.message}><Input type="number" {...register("price")} /></Field>
            <Field label="Turnaround (hours)" error={errors.turnaround_hours?.message}><Input type="number" {...register("turnaround_hours")} /></Field>
          </div>
          <Field label="Description" error={errors.description?.message}>
            <Textarea rows={3} {...register("description")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-[#14b8a6] hover:bg-[#0d9488] text-white">
              {initial ? "Save changes" : "Add test"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-[#0b1f3a]/80">{label}</Label>
      {children}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export default AdminTestsPage;
