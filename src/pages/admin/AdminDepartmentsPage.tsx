import { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { getAdminDepartments, addDepartment, updateDepartment, toggleDepartmentActive } from "@/lib/api";

export default function AdminDepartmentsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🏥");

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["adminDepartments"],
    queryFn: getAdminDepartments,
  });

  const toggleMutation = useMutation({
    mutationFn: (data: { id: string, current: boolean }) => toggleDepartmentActive(data.id, data.current),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDepartments"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update department status");
    }
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editingId ? updateDepartment(editingId, data) : addDepartment(data),
    onSuccess: () => {
      toast.success(editingId ? "Department updated" : "Department added");
      queryClient.invalidateQueries({ queryKey: ["adminDepartments"] });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save department");
    }
  });

  const filtered = departments.filter((d) => 
    d.name.toLowerCase().includes(query.toLowerCase())
  );

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setIcon("🏥");
  };

  const handleEdit = (dept: any) => {
    setEditingId(dept.id);
    setName(dept.name);
    setDescription(dept.description);
    setIcon(dept.icon);
    setIsOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ name, description, icon });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background page-fade">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Manage Departments</h1>
            <p className="mt-1 text-sm text-muted-foreground">Add or update hospital departments.</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Department" : "Add New Department"}</DialogTitle>
                <DialogDescription>Fill in the details for the department.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required disabled={saveMutation.isPending} />
                </div>
                <div className="grid gap-2">
                  <Label>Icon (Emoji)</Label>
                  <Input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={5} required disabled={saveMutation.isPending} />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required disabled={saveMutation.isPending} />
                </div>
                <Button type="submit" className="mt-2" disabled={saveMutation.isPending}>
                  {editingId ? "Update" : "Save"} Department
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
              placeholder="Search departments..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-8 w-8" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="flex justify-between items-center mt-4">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-6 w-10 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState 
            title="No departments found" 
            description="Add a new department or clear your search." 
            action={
              <Button onClick={() => setIsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Department
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d) => (
              <Card key={d.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span>{d.icon}</span> {d.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(d)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{d.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">
                      {d.is_active ? "Active" : "Inactive"}
                    </span>
                    <Switch 
                      checked={d.is_active} 
                      disabled={toggleMutation.isPending}
                      onCheckedChange={() => toggleMutation.mutate({ id: d.id, current: d.is_active })} 
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
