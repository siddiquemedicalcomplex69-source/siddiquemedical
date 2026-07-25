import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Users, UserPlus, Activity, Calendar as CalendarIcon, Settings, BarChart2, FlaskConical, ClipboardList } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllAppointments, getAdminDoctors, getAllPatients, getAdminDepartments } from "@/lib/api";

function StatCard({ title, value, icon: Icon, description }: { title: string; value: string; icon: any; description: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data: appointments = [], isLoading: loadApt } = useQuery({ queryKey: ["adminAppointments"], queryFn: getAllAppointments });
  const { data: doctors = [], isLoading: loadDoc } = useQuery({ queryKey: ["adminDoctors"], queryFn: getAdminDoctors });
  const { data: patients = [], isLoading: loadPat } = useQuery({ queryKey: ["adminPatients"], queryFn: getAllPatients });
  const { data: departments = [], isLoading: loadDept } = useQuery({ queryKey: ["adminDepartments"], queryFn: getAdminDepartments });

  const { activeDoctors, todayAppointments, activePatients, activeDepartments } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return {
      activeDoctors: doctors.filter((d: any) => d.is_active).length,
      todayAppointments: appointments.filter((a: any) => a.appointment_date.startsWith(todayStr)).length,
      activePatients: patients.filter((p: any) => p.is_active).length,
      activeDepartments: departments.filter((d: any) => d.is_active).length,
    };
  }, [appointments, doctors, patients, departments]);

  const quickLinks = [
    { to: "/admin/doctors", label: "Manage Doctors", icon: Activity },
    { to: "/admin/patients", label: "Manage Patients", icon: Users },
    { to: "/admin/appointments", label: "Manage Appointments", icon: CalendarIcon },
    { to: "/admin/departments", label: "Manage Departments", icon: Activity },
    { to: "/admin/reports", label: "Analytics & Reports", icon: BarChart2 },
    { to: "/admin/settings", label: "Global Settings", icon: Settings },
    { to: "/admin/tests", label: "Manage Lab Tests", icon: FlaskConical },
    { to: "/lab/portal", label: "Lab Bookings", icon: ClipboardList },
  ] as const;

  const isLoading = loadApt || loadDoc || loadPat || loadDept;

  return (
    <div className="flex min-h-screen flex-col bg-background page-fade">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of hospital operations.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Active Doctors" value={activeDoctors.toString()} description="Currently active on platform" icon={Activity} />
            <StatCard title="Active Patients" value={activePatients.toString()} description="Registered patients" icon={Users} />
            <StatCard title="Appointments Today" value={todayAppointments.toString()} description="Scheduled for today" icon={CalendarIcon} />
            <StatCard title="Departments" value={activeDepartments.toString()} description="Active departments" icon={UserPlus} />
          </div>
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {quickLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-4 text-center transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                      <link.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
