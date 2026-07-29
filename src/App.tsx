import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

// Public pages
const HomePage = lazy(() => import("@/pages/HomePage"));
const DoctorsPage = lazy(() => import("@/pages/DoctorsPage"));
const DoctorProfilePage = lazy(() => import("@/pages/DoctorProfilePage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));

// Patient pages
const AppointmentsPage = lazy(() => import("@/pages/patient/AppointmentsPage"));
const ProfilePage = lazy(() => import("@/pages/patient/ProfilePage"));
const MyTestsPage = lazy(() => import("@/pages/patient/MyTestsPage"));

// Doctor pages
const SchedulePage = lazy(() => import("@/pages/doctor/SchedulePage"));
const AvailabilityPage = lazy(() => import("@/pages/doctor/AvailabilityPage"));

// Admin pages
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminDoctorsPage = lazy(() => import("@/pages/admin/AdminDoctorsPage"));
const AdminAppointmentsPage = lazy(() => import("@/pages/admin/AdminAppointmentsPage"));
const AdminDepartmentsPage = lazy(() => import("@/pages/admin/AdminDepartmentsPage"));
const AdminPatientsPage = lazy(() => import("@/pages/admin/AdminPatientsPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/AdminSettingsPage"));
const AdminReportsPage = lazy(() => import("@/pages/admin/AdminReportsPage"));
const TestsManagementPage = lazy(() => import("@/pages/admin/TestsManagementPage"));

// Lab pages
const LabTestsPage = lazy(() => import("@/pages/LabTestsPage"));
const LabPortalPage = lazy(() => import("@/pages/lab/LabPortalPage"));

// Global routes
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

// Configure React Query for optimal caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
      gcTime: 10 * 60 * 1000,   // Cache stays in memory for 10 minutes
      retry: 1,                 // Only retry once on failure
      refetchOnWindowFocus: false, // Don't refetch every time user switches tabs
    },
  },
});

// Loading fallback for lazy loaded components
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-[#14b8a6]" />
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes — no auth required */}
              <Route path="/" element={<HomePage />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/doctors/:id" element={<DoctorProfilePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/lab-tests" element={<LabTestsPage />} />

              {/* Patient routes */}
              <Route path="/appointments" element={<ProtectedRoute allowedRoles={['patient']}><AppointmentsPage /></ProtectedRoute>} />
              <Route path="/my-tests" element={<ProtectedRoute allowedRoles={['patient']}><MyTestsPage /></ProtectedRoute>} />

              {/* Phase 2 routes */}
              <Route path="/profile" element={<ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}><ProfilePage /></ProtectedRoute>} />
              <Route path="/schedule" element={<ProtectedRoute allowedRoles={['doctor']}><SchedulePage /></ProtectedRoute>} />
              <Route path="/availability" element={<ProtectedRoute allowedRoles={['doctor']}><AvailabilityPage /></ProtectedRoute>} />
              
              {/* Phase 3 Admin routes */}
              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={['admin']}><AdminDoctorsPage /></ProtectedRoute>} />
              <Route path="/admin/appointments" element={<ProtectedRoute allowedRoles={['admin']}><AdminAppointmentsPage /></ProtectedRoute>} />
              <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={['admin']}><AdminDepartmentsPage /></ProtectedRoute>} />
              <Route path="/admin/patients" element={<ProtectedRoute allowedRoles={['admin']}><AdminPatientsPage /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettingsPage /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReportsPage /></ProtectedRoute>} />
              <Route path="/admin/tests" element={<ProtectedRoute allowedRoles={['admin']}><TestsManagementPage /></ProtectedRoute>} />

              {/* Lab Staff routes */}
              <Route path="/lab/portal" element={<ProtectedRoute allowedRoles={['lab_staff', 'admin']}><LabPortalPage /></ProtectedRoute>} />
              
              {/* Global routes */}
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              
              {/* Catch-all 404 route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
