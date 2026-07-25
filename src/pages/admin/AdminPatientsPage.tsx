import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { getAllPatients, togglePatientActive } from "@/lib/api";

type Patient = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  registered_at: string;
  total_appointments: number;
  total_lab_tests: number;
  is_active: boolean;
};

export default function AdminPatientsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["adminPatients"],
    queryFn: getAllPatients,
  });

  const toggleMutation = useMutation({
    mutationFn: (data: { id: string, current: boolean }) => togglePatientActive(data.id, data.current),
    onSuccess: (_, variables) => {
      toast.success(variables.current ? "Patient account suspended" : "Patient account reactivated");
      queryClient.invalidateQueries({ queryKey: ["adminPatients"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    }
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients as Patient[];
    return (patients as Patient[]).filter((p) => 
      p.full_name?.toLowerCase().includes(q) || 
      p.email?.toLowerCase().includes(q) || 
      (p.phone && p.phone.includes(q))
    );
  }, [patients, query]);

  return (
    <div className="flex min-h-screen flex-col bg-background page-fade">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Manage Patients</h1>
          <p className="mt-1 text-sm text-muted-foreground">View registered patients and manage their account access.</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by name, email or phone..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Total Bookings</TableHead>
                    <TableHead>Lab Tests</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="p-0 border-0">
                        <TableSkeleton columns={8} rows={5} />
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10">
                        <EmptyState 
                          title="No patients found" 
                          description="Try adjusting your search query."
                          action={
                            query ? (
                              <Button variant="outline" onClick={() => setQuery("")}>
                                Clear search
                              </Button>
                            ) : null
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name}</TableCell>
                      <TableCell>{p.email || "No email"}</TableCell>
                      <TableCell>{p.phone || "N/A"}</TableCell>
                      <TableCell>{format(parseISO(p.registered_at), "dd MMM yyyy")}</TableCell>
                      <TableCell>{p.total_appointments}</TableCell>
                      <TableCell>{p.total_lab_tests}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={p.is_active ? "border-green-200 bg-green-100 text-green-800" : "border-red-200 bg-red-100 text-red-800"}>
                          {p.is_active ? "Active" : "Suspended"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-muted-foreground">{p.is_active ? "Suspend" : "Activate"}</span>
                          <Switch 
                            checked={p.is_active} 
                            disabled={toggleMutation.isPending}
                            onCheckedChange={() => toggleMutation.mutate({ id: p.id, current: p.is_active })} 
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
