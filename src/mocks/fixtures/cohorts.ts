import type { CohortStats, Group, Observation, Patient } from "@/lib/fhir";

export const COHORTS: Group[] = [
  { resourceType: "Group", id: "diabetes", name: "Diabetes", quantity: 14000 },
  { resourceType: "Group", id: "hipertensao", name: "Hipertensão", quantity: 9800 },
];

const COHORT_STATS: Record<string, CohortStats> = {
  diabetes: {
    resourceType: "Basic",
    code: { text: "cohort-stats" },
    extension: [
      { url: "total", valueInteger: 14000 },
      { url: "genderDistribution", valueString: JSON.stringify({ male: 30, female: 70 }) },
      {
        url: "ageDistribution",
        valueString: JSON.stringify({ "18-39": 12, "40-59": 44, "60+": 44 }),
      },
      {
        url: "departmentDistribution",
        valueString: JSON.stringify({ Endocrinologia: 33, Cardiologia: 15 }),
      },
    ],
  },
  hipertensao: {
    resourceType: "Basic",
    code: { text: "cohort-stats" },
    extension: [
      { url: "total", valueInteger: 9800 },
      { url: "genderDistribution", valueString: JSON.stringify({ male: 45, female: 55 }) },
      {
        url: "ageDistribution",
        valueString: JSON.stringify({ "18-39": 8, "40-59": 40, "60+": 52 }),
      },
      {
        url: "departmentDistribution",
        valueString: JSON.stringify({ Cardiologia: 40, "Clínica Geral": 20 }),
      },
    ],
  },
};

interface AnonymizedPatientRecord {
  patient: Patient;
  observations: Observation[];
}

const COHORT_OBSERVATIONS: Record<string, AnonymizedPatientRecord[]> = {
  diabetes: [
    {
      patient: {
        resourceType: "Patient",
        id: "hash001",
        gender: "female",
        extension: [{ url: "ageRange", valueString: "60-69" }],
      },
      observations: [
        { resourceType: "Observation", id: "CO001", code: { text: "HbA1c" }, valueQuantity: { value: 8.1, unit: "%" } },
        { resourceType: "Observation", id: "CO002", code: { text: "Glicemia" }, valueQuantity: { value: 182, unit: "mg/dL" } },
        { resourceType: "Observation", id: "CO003", code: { text: "IMC" }, valueQuantity: { value: 31.2, unit: "kg/m²" } },
      ],
    },
    {
      patient: {
        resourceType: "Patient",
        id: "hash002",
        gender: "male",
        extension: [{ url: "ageRange", valueString: "50-59" }],
      },
      observations: [
        { resourceType: "Observation", id: "CO004", code: { text: "HbA1c" }, valueQuantity: { value: 7.2, unit: "%" } },
        { resourceType: "Observation", id: "CO005", code: { text: "Glicemia" }, valueQuantity: { value: 150, unit: "mg/dL" } },
        { resourceType: "Observation", id: "CO006", code: { text: "IMC" }, valueQuantity: { value: 28.4, unit: "kg/m²" } },
      ],
    },
  ],
  hipertensao: [
    {
      patient: {
        resourceType: "Patient",
        id: "hash101",
        gender: "female",
        extension: [{ url: "ageRange", valueString: "40-49" }],
      },
      observations: [
        { resourceType: "Observation", id: "CO007", code: { text: "PA sistólica" }, valueQuantity: { value: 150, unit: "mmHg" } },
      ],
    },
    {
      patient: {
        resourceType: "Patient",
        id: "hash102",
        gender: "male",
        extension: [{ url: "ageRange", valueString: "60-69" }],
      },
      observations: [
        { resourceType: "Observation", id: "CO008", code: { text: "PA sistólica" }, valueQuantity: { value: 160, unit: "mmHg" } },
      ],
    },
  ],
};

export function cohortStats(code: string): CohortStats | undefined {
  return COHORT_STATS[code];
}

export function cohortObservations(code: string): AnonymizedPatientRecord[] {
  return COHORT_OBSERVATIONS[code] ?? [];
}
