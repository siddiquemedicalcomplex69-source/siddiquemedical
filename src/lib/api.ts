import { supabase } from "./supabase";
import type { Department, DoctorCard, Availability, AppointmentDetail, InsertAppointment, InsertLabBooking, UpdateLabBooking, Profile, Doctor } from "@/types/database";
import { startOfToday, format } from "date-fns";

export async function getDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data;
}

export async function getAdminDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getDoctors(): Promise<DoctorCard[]> {
  const { data, error } = await supabase
    .from("doctor_cards")
    .select("*");
  if (error) throw error;
  return data;
}

export async function getAdminDoctors() {
  const { data, error } = await supabase
    .from("doctors")
    .select(`
      doctor_id:id,
      profile_id,
      specialty,
      qualification,
      experience_yrs,
      consultation_fee,
      is_active,
      profiles!inner (
        full_name,
        avatar_url
      ),
      departments!inner (
        id,
        name
      )
    `);
  if (error) throw error;
  
  return data.map((d: any) => ({
    doctor_id: d.doctor_id,
    profile_id: d.profile_id,
    full_name: d.profiles?.full_name,
    avatar_url: d.profiles?.avatar_url,
    specialty: d.specialty,
    qualification: d.qualification,
    experience_yrs: d.experience_yrs,
    consultation_fee: d.consultation_fee,
    department_id: d.departments?.id,
    department_name: d.departments?.name,
    is_active: d.is_active
  }));
}

export async function getDoctorById(id: string): Promise<DoctorCard | null> {
  const { data, error } = await supabase
    .from("doctor_cards")
    .select("*")
    .eq("doctor_id", id)
    .single();
  if (error) return null;
  return data;
}

export async function getDoctorAvailability(doctorId: string): Promise<Availability[]> {
  const { data, error } = await supabase
    .from("availability")
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("is_active", true);
  if (error) throw error;
  return data;
}


export async function getBookedSlots(doctorId: string, dateStr: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("start_time")
    .eq("doctor_id", doctorId)
    .eq("appointment_date", dateStr)
    .neq("status", "cancelled");
  if (error) return [];
  return (data as any[]).map((a) => a.start_time);
}

export async function bookAppointment(appt: InsertAppointment): Promise<any> {
  const { data, error } = await supabase
    .from("appointments")
    .insert(appt as any)
    .select()
    .single();
  if (error) {
    if (error.code === '23505') { // unique violation for double booking
      throw new Error("This slot is already taken. Please choose another.");
    }
    throw error;
  }
  return data;
}

export async function getUserAppointments(userId: string): Promise<AppointmentDetail[]> {
  const { data, error } = await supabase
    .from("appointment_details")
    .select("*")
    .eq("patient_id", userId)
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false });
  if (error) throw error;
  return data as any[];
}

export async function cancelAppointment(id: string) {
  const { error } = await (supabase as any)
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) throw error;
}

// --- PHASE 2 DOCTOR API ---

export async function getDoctorIdByProfileId(profileId: string): Promise<string | null> {
  const { data, error } = await (supabase as any)
    .from("doctors")
    .select("id")
    .eq("profile_id", profileId)
    .single();
  if (error || !data) return null;
  return data.id;
}

export async function getDoctorProfileDetails(profileId: string): Promise<Doctor | null> {
  const { data, error } = await (supabase as any)
    .from("doctors")
    .select("*")
    .eq("profile_id", profileId)
    .single();
  if (error) return null;
  return data as any as Doctor;
}

export async function getDoctorAppointments(doctorId: string, dateStr: string): Promise<AppointmentDetail[]> {
  const { data, error } = await supabase
    .from("appointment_details")
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("appointment_date", dateStr)
    .order("start_time", { ascending: true });
  if (error) throw error;
  return data as any[];
}

export async function getDoctorPendingAppointments(doctorId: string, fromDateStr: string): Promise<AppointmentDetail[]> {
  const { data, error } = await supabase
    .from("appointment_details")
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("status", "pending")
    .gte("appointment_date", fromDateStr)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw error;
  return data as any[];
}

export async function updateAppointmentStatus(id: string, newStatus: string) {
  const { error } = await (supabase as any)
    .from("appointments")
    .update({ status: newStatus })
    .eq("id", id);
  if (error) throw error;
}

export async function getDoctorAllAvailability(doctorId: string): Promise<Availability[]> {
  const { data, error } = await supabase
    .from("availability")
    .select("*")
    .eq("doctor_id", doctorId);
  if (error) throw error;
  return data;
}

export async function addDoctorAvailability(block: { doctor_id: string; day: string; start_time: string; end_time: string }) {
  const { error } = await (supabase as any)
    .from("availability")
    .insert(block);
  if (error) throw error;
}

export async function deleteDoctorAvailability(id: string) {
  const { error } = await supabase
    .from("availability")
    .delete()
    .eq("id", id);
  if (error) throw error;
}


// --- PHASE 2 PATIENT/PROFILE API ---

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as any as Profile;
}

export async function updateProfile(userId: string, updates: any) {
  const { error } = await (supabase as any)
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  if (error) throw error;

  if (updates.full_name) {
    await supabase.auth.updateUser({
      data: { full_name: updates.full_name }
    });
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const cloudName = "aixjey0j";
  const uploadPreset = "tzdlzovn";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  // We can attach the user ID as a public_id prefix or folder, but letting Cloudinary auto-generate is easiest.
  formData.append("folder", `hospital-foundation/avatars/${userId}`);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to upload image to Cloudinary");
  }

  const data = await response.json();
  return data.secure_url; // This is the fast, optimized Cloudinary URL
}

// --- PHASE 3 ADMIN API ---

export async function getAllAppointments(): Promise<AppointmentDetail[]> {
  const { data, error } = await supabase
    .from("appointment_details")
    .select("*")
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false });
  if (error) throw error;
  return data as any[];
}

export async function getAllPatients() {
  const { data, error } = await (supabase.rpc as any)('admin_get_patients_with_email');
  if (error) throw error;

  // We need to also fetch appointment and lab test counts for each patient
  const { data: allAppts } = await (supabase as any).from("appointments").select("patient_id");
  const { data: allLabs } = await (supabase as any).from("lab_bookings").select("patient_id");
  
  return (data as any[]).map((p: any) => ({
    ...p,
    total_appointments: (allAppts as any[])?.filter(a => a.patient_id === p.id).length || 0,
    total_lab_tests: (allLabs as any[])?.filter(l => l.patient_id === p.id).length || 0
  }));
}

export async function togglePatientActive(id: string, currentStatus: boolean) {
  const { error } = await (supabase as any)
    .from("profiles")
    .update({ is_active: !currentStatus })
    .eq("id", id);
  if (error) throw error;
}

export async function getGlobalSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", "global")
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows
  
  // Default values if no row exists yet
  return data || {
    hospital_name: "Siddique Medical Complex",
    contact_number: "+92 300 1234567",
    emergency_email: "emergency@siddiquemedical.com",
    address: "123 Health Avenue, Lahore, Pakistan",
    banner_enabled: true,
    banner_text: "Please note: OPD will be closed this Friday for a public holiday."
  };
}

export async function updateGlobalSettings(updates: any) {
  const { error, data } = await supabase
    .from("settings")
    .upsert({ id: "global", ...updates })
    .select();
  if (error) throw error;
}

export async function adminCreateDoctor(params: {
  admin_uid: string;
  doc_email: string;
  doc_password: string;
  doc_name: string;
  doc_department_id: string;
  doc_specialty: string;
  doc_qualification: string;
  doc_fee: number;
  doc_experience: number;
  doc_is_visiting: boolean;
  doc_slot_duration: number;
}) {
  const { data, error } = await (supabase.rpc as any)('admin_create_doctor', params);
  if (error) throw error;
  return data;
}

export async function updateDoctor(doctorId: string, profileId: string | null | undefined, updates: any, name?: string) {
  if (name && profileId) {
    const { error: pErr } = await (supabase as any).from('profiles').update({ full_name: name }).eq('id', profileId);
    if (pErr) throw pErr;
  }
  const { error } = await (supabase as any)
    .from("doctors")
    .update(updates)
    .eq("id", doctorId);
  if (error) throw error;
}

export async function toggleDoctorActive(doctorId: string, currentStatus: boolean) {
  const { error } = await (supabase as any)
    .from("doctors")
    .update({ is_active: !currentStatus })
    .eq("id", doctorId);
  if (error) throw error;
}

export async function addDepartment(dept: { name: string; description: string; icon: string }) {
  const { error } = await (supabase as any).from("departments").insert(dept);
  if (error) throw error;
}

export async function updateDepartment(id: string, updates: any) {
  const { error } = await (supabase as any).from("departments").update(updates).eq("id", id);
  if (error) throw error;
}

export async function toggleDepartmentActive(id: string, currentStatus: boolean) {
  const { error } = await (supabase as any).from("departments").update({ is_active: !currentStatus }).eq("id", id);
  if (error) throw error;
}

// --- LAB TESTS ---

export async function getLabCategories() {
  const { data, error } = await supabase
    .from("lab_test_categories")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getLabTests() {
  const { data, error } = await supabase
    .from("lab_tests")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function bookLabTest(booking: InsertLabBooking): Promise<any> {
  const { data, error } = await supabase
    .from("lab_bookings")
    .insert(booking as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getPatientLabBookings(patientId: string) {
  const { data, error } = await supabase
    .from("lab_booking_details")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAllLabBookings() {
  const { data, error } = await supabase
    .from("lab_booking_details")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateLabBooking(id: string, updates: UpdateLabBooking) {
  const { error } = await (supabase as any)
    .from("lab_bookings")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}
