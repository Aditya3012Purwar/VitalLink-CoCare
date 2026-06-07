import type { Patient } from "@/types/patient";
import type { Prescription } from "@/types/prescription";

export function applyPrescriptionToPatient(patient: Patient, rx: Prescription): Patient {
  const meds = rx.items.map((item, i) => ({
    id: `rx-${item.medicine_id}-${i}`,
    name: item.name,
    dose: item.dose,
    frequency: item.frequency,
    prescriber: rx.doctor_name,
    adherence: patient.adherenceScore,
    flag: item.instructions,
  }));

  return {
    ...patient,
    medications: meds,
    recentChanges: [
      {
        field: "Prescription issued",
        fieldZh: "處方已開立",
        before: `${patient.medications.length} medicines`,
        after: `${meds.length} medicines (updated)`,
        date: rx.created_at.slice(0, 10),
      },
      ...patient.recentChanges,
    ],
  };
}
