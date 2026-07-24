/**
 * types/database.ts
 *
 * TypeScript types that mirror the Supabase schema exactly.
 * These are used to type the Supabase client throughout the app.
 *
 * After running schema.sql, you can also auto-generate these by running:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
 */

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export type UserRole          = 'patient' | 'doctor' | 'admin' | 'lab_staff'
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type DayOfWeek         = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type NotificationType  = 'appointment_booked' | 'appointment_confirmed' | 'appointment_cancelled' | 'appointment_reminder' | 'general'

// ─── ROW TYPES ────────────────────────────────────────────────────────────────

export type Profile = {
  id            : string
  role          : UserRole
  full_name     : string
  phone         : string | null
  avatar_url    : string | null
  date_of_birth : string | null        // ISO date string e.g. "1990-05-14"
  gender        : 'male' | 'female' | 'other' | null
  address       : string | null
  is_active     : boolean
  created_at    : string
  updated_at    : string
}

export type Department = {
  id          : string
  name        : string
  description : string | null
  icon        : string | null
  is_active   : boolean
  created_at  : string
}

export type Doctor = {
  id                : string
  profile_id        : string
  department_id     : string
  specialty         : string
  qualification     : string
  experience_yrs    : number
  bio               : string | null
  consultation_fee  : number
  slot_duration_min : 15 | 20 | 30 | 45 | 60
  languages         : string[]
  is_visiting       : boolean
  is_active         : boolean
  created_at        : string
  updated_at        : string
}

export type Availability = {
  id         : string
  doctor_id  : string
  day        : DayOfWeek
  start_time : string       // "09:00:00"
  end_time   : string       // "17:00:00"
  is_active  : boolean
  created_at : string
}

export type Leave = {
  id         : string
  doctor_id  : string
  leave_date : string       // ISO date string e.g. "2025-12-25"
  reason     : string | null
  created_at : string
}

export type Appointment = {
  id               : string
  patient_id       : string
  doctor_id        : string
  appointment_date : string       // ISO date string
  start_time       : string       // "09:00:00"
  end_time         : string       // "09:30:00"
  status           : AppointmentStatus
  reason           : string | null
  notes            : string | null
  fee_charged      : number | null
  created_at       : string
  updated_at       : string
}

export type Notification = {
  id         : string
  user_id    : string
  type       : NotificationType
  title      : string
  message    : string
  is_read    : boolean
  metadata   : Record<string, unknown> | null
  created_at : string
}

export type Setting = {
  id             : string
  hospital_name  : string
  contact_number : string
  emergency_email: string
  address        : string
  banner_enabled : boolean
  banner_text    : string
  updated_at     : string
}

// ─── VIEW TYPES ───────────────────────────────────────────────────────────────

/** Returned by the doctor_cards view — everything needed for a doctor listing card */
export type DoctorCard = {
  doctor_id       : string
  full_name       : string
  avatar_url      : string | null
  specialty       : string
  qualification   : string
  experience_yrs  : number
  bio             : string | null
  consultation_fee: number
  slot_duration_min: number
  languages       : string[]
  is_visiting     : boolean
  department_id   : string
  department_name : string
  department_icon : string | null
}

/** Returned by the appointment_details view — full appointment with names */
export type AppointmentDetail = {
  id               : string
  appointment_date : string
  start_time       : string
  end_time         : string
  status           : AppointmentStatus
  reason           : string | null
  notes            : string | null
  fee_charged      : number | null
  created_at       : string
  patient_name     : string
  patient_phone    : string | null
  patient_id       : string
  doctor_name      : string
  doctor_specialty : string
  doctor_id        : string
  doctor_profile_id: string
  department_name  : string
}

// ─── INSERT / UPDATE TYPES ────────────────────────────────────────────────────

export type InsertAppointment = Omit<Appointment, 'id' | 'created_at' | 'updated_at'>
export type UpdateAppointment = Partial<Pick<Appointment, 'status' | 'notes' | 'fee_charged'>>

export type InsertDoctor      = Omit<Doctor, 'id' | 'created_at' | 'updated_at'>
export type UpdateDoctor      = Partial<Omit<Doctor, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>

export type InsertAvailability = Omit<Availability, 'id' | 'created_at'>
export type InsertLeave        = Omit<Leave, 'id' | 'created_at'>

// ── LAB MODULE TYPES ──────────────────────────────────────────

export type LabBookingStatus =
  | 'pending'
  | 'sample_date_set'
  | 'report_date_set'
  | 'completed'
  | 'cancelled'

export type LabTestCategory = {
  id        : string
  name      : string
  icon      : string | null
  is_active : boolean
  created_at: string
}

export type LabTest = {
  id               : string
  category_id      : string
  name             : string
  code             : string
  price            : number
  sample_type      : 'Blood' | 'Urine' | 'Stool' | 'Swab' | 'Semen' | 'Fluid'
  turnaround_hours : number
  description      : string | null
  is_active        : boolean
  created_at       : string
  updated_at       : string
}

export type LabBooking = {
  id                     : string
  patient_id             : string
  test_id                : string
  booking_date           : string
  preferred_date         : string | null
  status                 : LabBookingStatus
  sample_collection_date : string | null
  report_collection_date : string | null
  notes                  : string | null
  created_at             : string
  updated_at             : string
}

export type LabBookingDetail = {
  id                     : string
  booking_date           : string
  preferred_date         : string | null
  status                 : LabBookingStatus
  sample_collection_date : string | null
  report_collection_date : string | null
  notes                  : string | null
  created_at             : string
  patient_name           : string
  patient_phone          : string | null
  patient_id             : string
  test_name              : string
  test_code              : string
  price                  : number
  sample_type            : string | null
  turnaround_hours       : number | null
}

export const statusLabel: Record<LabBookingStatus, string> = {
  pending: "Pending",
  sample_date_set: "Sample Date Set",
  report_date_set: "Report Date Set",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const statusClass: Record<LabBookingStatus, string> = {
  pending: "bg-orange-100 text-orange-700 border-orange-200",
  sample_date_set: "bg-blue-100 text-blue-700 border-blue-200",
  report_date_set: "bg-purple-100 text-purple-700 border-purple-200",
  completed: "bg-teal-100 text-teal-700 border-teal-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200",
};

export type InsertLabBooking = {
  patient_id     : string
  test_id        : string
  booking_date?  : string
  preferred_date?: string | null
  status?        : LabBookingStatus
  sample_collection_date?: string | null
  report_collection_date?: string | null
  notes?         : string | null
}

export type UpdateLabBooking = Partial<Pick<LabBooking,
  | 'status'
  | 'sample_collection_date'
  | 'report_collection_date'
  | 'notes'
>>

// ─── DATABASE SHAPE (for typed Supabase client) ───────────────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row    : Profile
        Insert : Omit<Profile, 'created_at' | 'updated_at'>
        Update : Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      departments: {
        Row    : Department
        Insert : Omit<Department, 'id' | 'created_at'>
        Update : Partial<Omit<Department, 'id' | 'created_at'>>
      }
      doctors: {
        Row    : Doctor
        Insert : InsertDoctor
        Update : UpdateDoctor
      }
      availability: {
        Row    : Availability
        Insert : InsertAvailability
        Update : Partial<InsertAvailability>
      }
      leaves: {
        Row    : Leave
        Insert : InsertLeave
        Update : Partial<InsertLeave>
      }
      appointments: {
        Row    : Appointment
        Insert : InsertAppointment
        Update : UpdateAppointment
      }
      notifications: {
        Row    : Notification
        Insert : Omit<Notification, 'id' | 'created_at'>
        Update : Partial<Pick<Notification, 'is_read'>>
      }
      settings: {
        Row    : Setting
        Insert : Partial<Setting>
        Update : Partial<Setting>
      }
      lab_test_categories: {
        Row: LabTestCategory
        Insert: Omit<LabTestCategory, 'id' | 'created_at'>
        Update: Partial<Omit<LabTestCategory, 'id' | 'created_at'>>
      }
      lab_tests: {
        Row: LabTest
        Insert: Omit<LabTest, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<LabTest, 'id' | 'created_at' | 'updated_at'>>
      }
      lab_bookings: {
        Row   : LabBooking
        Insert: InsertLabBooking
        Update: UpdateLabBooking
      }
    }
    Views: {
      doctor_cards: {
        Row: DoctorCard
      }
      appointment_details: {
        Row: AppointmentDetail
      }
      lab_booking_details: {
        Row: LabBookingDetail
      }
    }
    Functions: {
      get_my_role: {
        Args   : Record<string, never>
        Returns: UserRole
      }
      get_my_doctor_id: {
        Args   : Record<string, never>
        Returns: string
      }
      admin_create_doctor: {
        Args: {
          admin_uid: string
          doc_email: string
          doc_password: string
          doc_name: string
          doc_department_id: string
          doc_specialty: string
          doc_qualification: string
          doc_fee: number
          doc_experience: number
          doc_is_visiting: boolean
          doc_slot_duration: number
        }
        Returns: string
      }
    }
    Enums: {
      user_role          : UserRole
      appointment_status : AppointmentStatus
      day_of_week        : DayOfWeek
      notification_type  : NotificationType
      lab_booking_status : LabBookingStatus
    }
  }
}
