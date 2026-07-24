-- Update the RLS policy to allow patients to cancel both pending AND confirmed appointments
DROP POLICY IF EXISTS "Patients can cancel their own pending appointments" ON appointments;

CREATE POLICY "Patients can cancel their own appointments"
  ON appointments FOR UPDATE
  USING (
    patient_id = auth.uid()
    AND status IN ('pending', 'confirmed')
  )
  WITH CHECK (
    patient_id = auth.uid()
    AND status = 'cancelled'
  );
