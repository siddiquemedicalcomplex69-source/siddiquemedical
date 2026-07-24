import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Edit, Search, Eye, EyeOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { getAdminDoctors, getDepartments, toggleDoctorActive, adminCreateDoctor, updateDoctor } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function AdminDoctorsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [fee, setFee] = useState("");
  const [isVisiting, setIsVisiting] = useState(false);

  const { data: doctors = [], isLoading: isLoadingDocs } = useQuery({
    queryKey: ["adminDoctors"],
    queryFn: getAdminDoctors,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["adminDepartments"],
    queryFn: getDepartments,
  });

  const toggleMutation = useMutation({
    mutationFn: (data: { doctorId: string, current: boolean }) => toggleDoctorActive(data.doctorId, data.current),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDoctors"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update doctor status");
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        return updateDoctor(editingId, {
          department_id: data.doc_department_id,
          specialty: data.doc_specialty,
          qualification: data.doc_qualification,
          experience_yrs: data.doc_experience,
          consultation_fee: data.doc_fee,
          is_visiting: data.doc_is_visiting,
        });
      } else {
        if (!user) throw new Error("Admin not authenticated");
        return adminCreateDoctor({ ...data, admin_uid: user.id });
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Doctor updated" : "Doctor added");
      queryClient.invalidateQueries({ queryKey: ["adminDoctors"] });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save doctor");
    }
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter((d: any) => 
      d.full_name?.toLowerCase().includes(q) || 
      d.specialty?.toLowerCase().includes(q) ||
      d.department_name?.toLowerCase().includes(q)
    );
  }, [doctors, query]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setDepartmentId("");
    setSpecialty("");
    setQualification("");
    setExperience("");
    setFee("");
    setIsVisiting(false);
  };

  const handleEdit = (doc: any) => {
    setEditingId(doc.doctor_id); // actually profile_id for updates
    setName(doc.full_name);
    // email/password cannot be edited here
    setDepartmentId(doc.department_id);
    setSpecialty(doc.specialty);
    setQualification(doc.qualification);
    setExperience(doc.experience_yrs.toString());
    setFee(doc.consultation_fee.toString());
    setIsVisiting(doc.is_visiting);
    setIsOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      doc_email: email,
      doc_password: password,
      doc_name: name,
      doc_department_id: departmentId,
      doc_specialty: specialty,
      doc_qualification: qualification,
      doc_fee: Number(fee),
      doc_experience: Number(experience),
      doc_is_visiting: isVisiting,
      doc_slot_duration: 30, // default
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background page-fade">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Manage Doctors</h1>
            <p className="mt-1 text-sm text-muted-foreground">Add or update doctor profiles and access.</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Doctor Details" : "Add New Doctor"}</DialogTitle>
                <DialogDescription>
                  {editingId 
                    ? "Update the doctor's professional details." 
                    : "Create a new doctor account. They can log in with the email and password you set here."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave} className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Full Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required disabled={!!editingId || saveMutation.isPending} />
                  </div>
                  
                  {!editingId && (
                    <>
                      <div className="col-span-2">
                        <Label>Email</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={saveMutation.isPending} />
                      </div>
                      <div className="col-span-2">
                        <Label>Initial Password</Label>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            disabled={saveMutation.isPending} 
                          />
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Make sure to securely share this password with the doctor.</p>
                      </div>
                    </>
                  )}

                  <div className="col-span-2">
                    <Label>Department</Label>
                    <Select value={departmentId} onValueChange={setDepartmentId} required disabled={saveMutation.isPending}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2 sm:col-span-1">
                    <Label>Specialty</Label>
                    <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} required disabled={saveMutation.isPending} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label>Qualification</Label>
                    <Input value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. MBBS, FCPS" required disabled={saveMutation.isPending} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label>Experience (Years)</Label>
                    <Input type="number" min="0" value={experience} onChange={(e) => setExperience(e.target.value)} required disabled={saveMutation.isPending} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label>Fee (PKR)</Label>
                    <Input type="number" min="0" value={fee} onChange={(e) => setFee(e.target.value)} required disabled={saveMutation.isPending} />
                  </div>
                  <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label>Is Visiting Specialist?</Label>
                      <p className="text-[10px] text-muted-foreground">Turn on for visiting doctors. Keep off for permanently employed hospital staff.</p>
                    </div>
                    <Switch checked={isVisiting} onCheckedChange={setIsVisiting} disabled={saveMutation.isPending} />
                  </div>
                </div>
                <Button type="submit" className="mt-2" disabled={saveMutation.isPending}>
                  {editingId ? "Update" : "Save"} Doctor
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name, specialty, or department..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoadingDocs ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-3 mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState 
            title="No doctors found" 
            description="Add a new doctor to get started or clear your search." 
            action={
              <Button onClick={() => setIsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Doctor
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d: any) => (
              <Card key={d.doctor_id} className={d.is_active ? "" : "opacity-75"}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-secondary flex-shrink-0">
                        {d.avatar_url ? (
                          <img src={d.avatar_url} alt={d.full_name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-lg font-semibold text-muted-foreground">
                            {d.full_name?.charAt(0) || "D"}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold leading-none">{d.full_name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{d.specialty}</p>
                        <div className="mt-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            d.is_visiting 
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          }`}>
                            {d.is_visiting ? "Visiting" : "Hospital Staff"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2" onClick={() => handleEdit(d)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department:</span>
                      <span className="font-medium">{d.department_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fee:</span>
                      <span className="font-medium">PKR {d.consultation_fee}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <span className="text-xs font-medium text-muted-foreground">
                      {d.is_active ? "Account Active" : "Account Suspended"}
                    </span>
                    <Switch 
                      checked={d.is_active} 
                      disabled={toggleMutation.isPending}
                      onCheckedChange={() => toggleMutation.mutate({ doctorId: d.doctor_id, current: d.is_active })} 
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
