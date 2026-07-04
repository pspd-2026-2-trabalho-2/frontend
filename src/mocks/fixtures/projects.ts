import type { ResearchStudy } from "@/lib/fhir";

export const PROJECTS: ResearchStudy[] = [
  {
    resourceType: "ResearchStudy",
    id: "PRJ01",
    title: "Impacto da Metformina em pacientes diabéticos",
    status: "active",
    condition: [{ text: "Diabetes" }],
    period: { end: "2027-01-01" },
  },
  {
    resourceType: "ResearchStudy",
    id: "PRJ02",
    title: "Prevalência de Hipertensão em idosos",
    status: "suspended",
    condition: [{ text: "Hipertensão" }],
    period: { end: "2026-12-01" },
  },
];
