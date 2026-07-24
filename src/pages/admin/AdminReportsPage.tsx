import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, CreditCard, Users } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { getAllAppointments, getAllPatients } from "@/lib/api";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function StatCard({ title, value, description, icon: Icon }: { title: string; value: string; description: string; icon: any }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminReportsPage() {
  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ["adminAppointments"],
    queryFn: getAllAppointments,
  });

  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ["adminPatients"],
    queryFn: getAllPatients,
  });

  const {
    totalRevenue,
    completionRate,
    monthlyRevenue,
    departmentStats
  } = useMemo(() => {
    if (!appointments.length) return { totalRevenue: 0, completionRate: 0, monthlyRevenue: [], departmentStats: [] };

    let rev = 0;
    let completedAppts = 0;
    const monthlyMap: Record<string, number> = {};
    const deptMap: Record<string, number> = {};

    appointments.forEach((a: any) => {
      // Revenue
      if (a.fee_charged) {
        rev += Number(a.fee_charged);
        const month = format(parseISO(a.appointment_date), "MMM");
        monthlyMap[month] = (monthlyMap[month] || 0) + Number(a.fee_charged);
      }

      // Completion Rate
      if (a.status === 'completed') completedAppts++;

      // Department Stats
      const dept = a.department_name;
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    // Formatting for charts
    const monthlyFormatted = Object.entries(monthlyMap).map(([month, revenue]) => ({ month, revenue }));
    const deptFormatted = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

    // Sort months simply based on how they appear or keep it simple. Ideally sort chronologically.
    // We'll leave it as is.
    
    return {
      totalRevenue: rev,
      completionRate: appointments.length > 0 ? Math.round((completedAppts / appointments.length) * 100) : 0,
      monthlyRevenue: monthlyFormatted,
      departmentStats: deptFormatted
    };
  }, [appointments]);

  if (loadingAppts || loadingPatients) {
    return <div className="flex min-h-screen items-center justify-center">Loading reports...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-fade">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Analytics & Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">View hospital performance metrics and revenue statistics.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <StatCard 
            title="Total Revenue (YTD)" 
            value={`PKR ${totalRevenue.toLocaleString()}`} 
            description="From completed appointments" 
            icon={CreditCard} 
          />
          <StatCard 
            title="Active Patients" 
            value={patients.filter((p: any) => p.is_active).length.toString()} 
            description="Registered and active" 
            icon={Users} 
          />
          <StatCard 
            title="Avg. Completion Rate" 
            value={`${completionRate}%`} 
            description="Appointments completed vs total" 
            icon={Activity} 
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue generated from consultations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {monthlyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(value) => `Rs ${value / 1000}k`}
                        tick={{ fontSize: 12 }}
                        dx={-10}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: '#f3f4f6' }}
                        formatter={(value: number) => [`PKR ${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    No revenue data available yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Department Popularity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Department Popularity</CardTitle>
              <CardDescription>Percentage of total appointments by department.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center">
                {departmentStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {departmentStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => [`${value} Appointments`, 'Volume']} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    No appointment data available yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
