import type {
  Condition,
  Encounter,
  MedicationRequest,
  Observation,
  Patient,
} from "@/lib/fhir";

interface FullPatientRecord {
  id: string;
  fullName: string;
  birthDate: string;
  gender: Patient["gender"];
  city: string;
  state: string;
  cpf: string;
  cns: string;
}

const FULL_PATIENTS: FullPatientRecord[] = [
  {
    id: "P000001",
    fullName: "João da Silva",
    birthDate: "1970-05-10",
    gender: "male",
    city: "Brasília",
    state: "DF",
    cpf: "111.111.111-11",
    cns: "123456789012345",
  },
  {
    id: "P000002",
    fullName: "Maria Souza",
    birthDate: "1985-11-02",
    gender: "female",
    city: "Goiânia",
    state: "GO",
    cpf: "222.222.222-22",
    cns: "234567890123456",
  },
];

function initials(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => `${part[0].toUpperCase()}.`)
    .join(" ");
}

/** MEDICO — acesso FULL: todos os campos, sem anonimização. */
export function patientsFull(): Patient[] {
  return FULL_PATIENTS.map((p) => ({
    resourceType: "Patient",
    id: p.id,
    name: [{ text: p.fullName }],
    birthDate: p.birthDate,
    gender: p.gender,
    address: [{ city: p.city, state: p.state }],
    identifier: [
      { system: "cpf", value: p.cpf },
      { system: "cns", value: p.cns },
    ],
  }));
}

/** ESTAGIARIO — acesso PARTIAL: iniciais, ano de nascimento, sem CPF/CNS/endereço completo. */
export function patientsPartial(): Patient[] {
  return FULL_PATIENTS.map((p) => ({
    resourceType: "Patient",
    id: p.id,
    name: [{ text: initials(p.fullName) }],
    birthDate: p.birthDate.slice(0, 4),
    gender: p.gender,
    address: [{ state: p.state }],
  }));
}

export function patientById(id: string, partial: boolean): Patient | undefined {
  const list = partial ? patientsPartial() : patientsFull();
  return list.find((p) => p.id === id);
}

export const ENCOUNTERS: Record<string, Encounter[]> = {
  P000001: [
    {
      resourceType: "Encounter",
      id: "E00042",
      status: "finished",
      class: "AMB",
      period: { start: "2026-06-20", end: "2026-06-20" },
      serviceType: { text: "Cardiologia" },
    },
  ],
  P000002: [
    {
      resourceType: "Encounter",
      id: "E00043",
      status: "finished",
      class: "RETORNO",
      period: { start: "2026-06-25", end: "2026-06-25" },
      serviceType: { text: "Endocrinologia" },
    },
  ],
};

export const CONDITIONS: Record<string, Condition[]> = {
  P000001: [
    { resourceType: "Condition", id: "C001", code: { text: "Diabetes Tipo 2" }, onsetDateTime: "2023-02-10" },
    { resourceType: "Condition", id: "C002", code: { text: "Hipertensão Arterial" }, onsetDateTime: "2024-04-18" },
  ],
  P000002: [
    { resourceType: "Condition", id: "C003", code: { text: "Obesidade" }, onsetDateTime: "2022-01-01" },
  ],
};

export const OBSERVATIONS: Record<string, Observation[]> = {
  P000001: [
    {
      resourceType: "Observation",
      id: "O001",
      code: { text: "Glicemia" },
      valueQuantity: { value: 182, unit: "mg/dL" },
      effectiveDateTime: "2026-06-20",
    },
    {
      resourceType: "Observation",
      id: "O002",
      code: { text: "HbA1c" },
      valueQuantity: { value: 8.1, unit: "%" },
      effectiveDateTime: "2026-06-15",
    },
  ],
  P000002: [
    {
      resourceType: "Observation",
      id: "O003",
      code: { text: "IMC" },
      valueQuantity: { value: 31.2, unit: "kg/m²" },
      effectiveDateTime: "2026-06-25",
    },
    {
      resourceType: "Observation",
      id: "O004",
      code: { text: "Glicemia" },
      valueQuantity: { value: 150, unit: "mg/dL" },
      effectiveDateTime: "2026-06-25",
    },
  ],
};

export const MEDICATIONS: Record<string, MedicationRequest[]> = {
  P000001: [
    {
      resourceType: "MedicationRequest",
      id: "M001",
      medicationCodeableConcept: { text: "Metformina 850 mg" },
      status: "active",
      authoredOn: "2023-02-10",
    },
    {
      resourceType: "MedicationRequest",
      id: "M002",
      medicationCodeableConcept: { text: "Losartana 50 mg" },
      status: "active",
      authoredOn: "2024-04-18",
    },
  ],
  P000002: [
    {
      resourceType: "MedicationRequest",
      id: "M003",
      medicationCodeableConcept: { text: "Insulina NPH" },
      status: "active",
      authoredOn: "2022-01-01",
    },
  ],
};
