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

export interface Page<T> {
  data: T;
  hasMore: boolean;
}

async function fetchApi(path: string): Promise<Response> {
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

  return response;
}

async function request<T>(path: string): Promise<T> {
  const response = await fetchApi(path);
  return (await response.json()) as T;
}

// Rotas de listagem de pacientes são paginadas pelo gateway (proteção contra
// Bundles FHIR maiores que o limite de mensagem gRPC). hasMore vem do header
// X-Has-More.
async function requestPage<T>(path: string): Promise<Page<T>> {
  const response = await fetchApi(path);
  const hasMore = response.headers.get("X-Has-More") === "true";
  return { data: (await response.json()) as T, hasMore };
}

export const api = {
  doctorPatients: (page = 1, pageSize = 50) =>
    requestPage<FhirBundle>(`/api/me/patients?page=${page}&pageSize=${pageSize}`),
  supervisedPatients: (page = 1, pageSize = 50) =>
    requestPage<FhirBundle>(`/api/me/supervised-patients?page=${page}&pageSize=${pageSize}`),
  patientSummary: (id: string) => request<FhirBundle>(`/api/patients/${id}/summary`),
  patientHistory: (id: string) => request<FhirBundle>(`/api/patients/${id}/history`),
  cohortStatistics: (code: string) =>
    request<CohortStatistics>(`/api/cohorts/${code}/statistics`),
  cohortExams: (code: string) => request<FhirBundle>(`/api/cohorts/${code}/exams`),
  projects: () => request<FhirBundle>("/api/me/projects"),
};
