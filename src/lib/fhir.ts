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
  class?: string;
  period: { start: string; end?: string };
  serviceType?: { text: string };
}

export interface Condition {
  resourceType: "Condition";
  id: string;
  code: { text: string };
  onsetDateTime?: string;
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

export interface Group {
  resourceType: "Group";
  id: string;
  name: string;
  quantity: number;
}

export interface CohortStats {
  resourceType: "Basic";
  code: { text: "cohort-stats" };
  extension: { url: string; valueInteger?: number; valueString?: string }[];
}

export interface ResearchStudy {
  resourceType: "ResearchStudy";
  id: string;
  title: string;
  status: "active" | "completed" | "suspended" | "administratively-completed";
  condition: { text: string }[];
  period?: { end?: string };
}

export type FhirResource =
  | Patient
  | Encounter
  | Condition
  | Observation
  | MedicationRequest
  | Group
  | ResearchStudy;

export function resourcesOfType<T extends FhirResource>(
  bundle: FhirBundle,
  resourceType: T["resourceType"],
): T[] {
  return bundle.entry
    .map((e) => e.resource)
    .filter((r): r is T => r.resourceType === resourceType);
}

export function parseCohortStats(basic: CohortStats) {
  const get = (url: string) => basic.extension.find((e) => e.url === url);
  const parseDistribution = (url: string): Record<string, number> => {
    const raw = get(url)?.valueString;
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  };

  return {
    total: get("total")?.valueInteger ?? 0,
    genderDistribution: parseDistribution("genderDistribution"),
    ageDistribution: parseDistribution("ageDistribution"),
    departmentDistribution: parseDistribution("departmentDistribution"),
  };
}
