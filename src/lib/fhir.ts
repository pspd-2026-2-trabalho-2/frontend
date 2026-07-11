export interface FhirBundle<T = FhirResource> {
  resourceType: "Bundle";
  type: "searchset" | "collection";
  total?: number;
  entry: { resource: T }[];
}

export interface Patient {
  resourceType: "Patient";
  id: string;
  name?: { text: string }[];
  birthDate?: string;
  gender?: "male" | "female" | "other" | "unknown";
  address?: { city?: string; state?: string }[];
  identifier?: { system: string; value: string }[];
  extension?: { url: string; valueString?: string }[];
}

export interface Encounter {
  resourceType: "Encounter";
  id: string;
  status: string;
  type?: { text: string }[];
  period: { start: string; end?: string };
  serviceType?: { text: string };
}

export interface Condition {
  resourceType: "Condition";
  id: string;
  code: { text: string };
  recordedDate?: string;
  subject?: { reference: string };
}

export interface Observation {
  resourceType: "Observation";
  id: string;
  code: { text: string };
  valueQuantity?: { value: number; unit: string };
  effectiveDateTime?: string;
}

export interface MedicationRequest {
  resourceType: "MedicationRequest";
  id: string;
  medicationCodeableConcept: { text: string };
  status: string;
  authoredOn?: string;
}

export interface ResearchStudy {
  resourceType: "ResearchStudy";
  id: string;
  title: string;
  status:
    | "active"
    | "completed"
    | "temporarily-closed-to-accrual"
    | "withdrawn"
    | "in-progress";
}

export const AGE_RANGE_EXTENSION_URL =
  "http://pspd.unb.br/fhir/StructureDefinition/age-range";

export type FhirResource =
  | Patient
  | Encounter
  | Condition
  | Observation
  | MedicationRequest
  | ResearchStudy;

export function resourcesOfType<T extends FhirResource>(
  bundle: FhirBundle,
  resourceType: T["resourceType"],
): T[] {
  return bundle.entry
    .map((e) => e.resource)
    .filter((r): r is T => r.resourceType === resourceType);
}

// CohortStatisticsResponse do gateway (não é um recurso FHIR — vem do
// datatransform.v1.CohortStatisticsResponse). Campos int64 (total_patients,
// count) são serializados como string pelo protojson.
export interface CohortPercentage {
  key: string;
  count: string;
  percentage: number;
}

// Campos com valor zero (0, "", []) são omitidos pelo protojson, por isso
// todos aparecem como opcionais aqui.
export interface CohortStatistics {
  conditionCode?: string;
  totalPatients?: string;
  bySex?: CohortPercentage[];
  byAgeRange?: CohortPercentage[];
  meanHba1c?: number;
  medianHba1c?: number;
  medicationFrequency?: CohortPercentage[];
  byDepartment?: CohortPercentage[];
}
