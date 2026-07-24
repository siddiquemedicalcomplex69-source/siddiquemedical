import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

// Public pages
import HomePage from "@/pages/HomePage";
import DoctorsPage from "@/pages/DoctorsPage";
import DoctorProfilePage from "@/pages/DoctorProfilePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";

// Patient pages
import AppointmentsPage from "@/pages/patient/AppointmentsPage";

import ProtectedRoute from "@/components/ProtectedRoute";

// Doctor pages
import SchedulePage from "@/pages/doctor/SchedulePage";
import AvailabilityPage from "@/pages/doctor/AvailabilityPage";

// Patient profile
import ProfilePage from "@/pages/patient/ProfilePage";

import NotificationsPage from "@/pages/NotificationsPage";

import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminDoctorsPage from "@/pages/admin/AdminDoctorsPage";
import AdminAppointmentsPage from "@/pages/admin/AdminAppointmentsPage";
import AdminDepartmentsPage from "@/pages/admin/AdminDepartmentsPage";
import AdminPatientsPage from "@/pages/admin/AdminPatientsPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminReportsPage from "@/pages/admin/AdminReportsPage";

// Lab Tests pages
import LabTestsPage from "@/pages/LabTestsPage";
import MyTestsPage from "@/pages/patient/MyTestsPage";
import LabPortalPage from "@/pages/lab/LabPortalPage";
import TestsManagementPage from "@/pages/admin/TestsManagementPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes — no auth required */}
            <Route path="/" element={<HomePage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/doctors/:id" element={<DoctorProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/lab-tests" element={<LabTestsPage />} />

            {/* Patient routes */}
            <Route path="/appointments" element={<AppointmentsPage />} />
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
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
