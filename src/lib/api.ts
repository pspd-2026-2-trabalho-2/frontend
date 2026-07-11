import { getAccessToken, notifyUnauthorized } from "@/features/auth/tokenStore";
import type { CohortStatistics, FhirBundle } from "@/lib/fhir";

const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string): Promise<T> {
  const token = getAccessToken();

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: "application/fhir+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401) {
    notifyUnauthorized();
    throw new ApiError("Sessão expirada. Faça login novamente.", 401);
  }

  if (response.status === 403) {
    throw new ApiError("Você não tem autorização para acessar este recurso.", 403);
  }

  if (!response.ok) {
    throw new ApiError(
      `Falha ao consultar a API (${response.status}).`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

export const api = {
  doctorPatients: () => request<FhirBundle>("/api/me/patients"),
  supervisedPatients: () => request<FhirBundle>("/api/me/supervised-patients"),
  patientSummary: (id: string) => request<FhirBundle>(`/api/patients/${id}/summary`),
  patientHistory: (id: string) => request<FhirBundle>(`/api/patients/${id}/history`),
  cohortStatistics: (code: string) =>
    request<CohortStatistics>(`/api/cohorts/${code}/statistics`),
  cohortExams: (code: string) => request<FhirBundle>(`/api/cohorts/${code}/exams`),
  projects: () => request<FhirBundle>("/api/me/projects"),
};
