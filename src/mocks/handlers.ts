import { http, HttpResponse } from "msw";

import { toAuthUser, type Role } from "@/features/auth/jwt";
import type { FhirBundle, FhirResource } from "@/lib/fhir";
import { cohortObservations, cohortStats, COHORTS } from "./fixtures/cohorts";
import {
  CONDITIONS,
  ENCOUNTERS,
  MEDICATIONS,
  OBSERVATIONS,
  patientById,
  patientsFull,
  patientsPartial,
} from "./fixtures/patients";
import { PROJECTS } from "./fixtures/projects";

function bundle(resources: FhirResource[]): FhirBundle {
  return {
    resourceType: "Bundle",
    type: "searchset",
    total: resources.length,
    entry: resources.map((resource) => ({ resource })),
  };
}

function roleFromRequest(request: Request): Role | null {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace(/^Bearer /, "");
  if (!token) return null;
  return toAuthUser(token)?.role ?? null;
}

function forbidden() {
  return HttpResponse.json(
    { error: "FORBIDDEN", message: "Você não tem autorização para acessar este recurso." },
    { status: 403 },
  );
}

function unauthorized() {
  return HttpResponse.json(
    { error: "UNAUTHORIZED", message: "Token ausente ou inválido." },
    { status: 401 },
  );
}

function notFound() {
  return HttpResponse.json({ error: "NOT_FOUND", message: "Recurso não encontrado." }, { status: 404 });
}

export const handlers = [
  http.get("*/api/patients", ({ request }) => {
    const role = roleFromRequest(request);
    if (!role) return unauthorized();
    if (role === "PESQUISADOR") return forbidden();

    const patients = role === "MEDICO" ? patientsFull() : patientsPartial();
    return HttpResponse.json(bundle(patients));
  }),

  http.get("*/api/patients/:id/summary", ({ request, params }) => {
    const role = roleFromRequest(request);
    if (!role) return unauthorized();
    if (role === "PESQUISADOR") return forbidden();

    const id = params.id as string;
    const patient = patientById(id, role === "ESTAGIARIO");
    if (!patient) return notFound();

    const resources: FhirResource[] = [
      patient,
      ...(ENCOUNTERS[id]?.slice(0, 1) ?? []),
      ...(CONDITIONS[id] ?? []),
      ...(OBSERVATIONS[id] ?? []),
      ...(MEDICATIONS[id] ?? []),
    ];
    return HttpResponse.json(bundle(resources));
  }),

  http.get("*/api/patients/:id/history", ({ request, params }) => {
    const role = roleFromRequest(request);
    if (!role) return unauthorized();
    if (role === "PESQUISADOR") return forbidden();

    const id = params.id as string;
    const patient = patientById(id, role === "ESTAGIARIO");
    if (!patient) return notFound();

    const resources: FhirResource[] = [
      patient,
      ...(ENCOUNTERS[id] ?? []),
      ...(CONDITIONS[id] ?? []),
      ...(OBSERVATIONS[id] ?? []),
      ...(MEDICATIONS[id] ?? []),
    ];
    return HttpResponse.json(bundle(resources));
  }),

  http.get("*/api/patients/:id/observations", ({ request, params }) => {
    const role = roleFromRequest(request);
    if (!role) return unauthorized();
    if (role === "PESQUISADOR") return forbidden();

    const id = params.id as string;
    if (!patientById(id, role === "ESTAGIARIO")) return notFound();

    return HttpResponse.json(bundle(OBSERVATIONS[id] ?? []));
  }),

  http.get("*/api/patients/:id/medications", ({ request, params }) => {
    const role = roleFromRequest(request);
    if (!role) return unauthorized();
    if (role === "PESQUISADOR") return forbidden();

    const id = params.id as string;
    if (!patientById(id, role === "ESTAGIARIO")) return notFound();

    return HttpResponse.json(bundle(MEDICATIONS[id] ?? []));
  }),

  http.get("*/api/cohorts", ({ request }) => {
    const role = roleFromRequest(request);
    if (!role) return unauthorized();
    if (role !== "PESQUISADOR") return forbidden();

    return HttpResponse.json(bundle(COHORTS));
  }),

  http.get("*/api/cohorts/:code/stats", ({ request, params }) => {
    const role = roleFromRequest(request);
    if (!role) return unauthorized();
    if (role !== "PESQUISADOR") return forbidden();

    const stats = cohortStats(params.code as string);
    if (!stats) return notFound();
    return HttpResponse.json(stats);
  }),

  http.get("*/api/cohorts/:code/observations", ({ request, params }) => {
    const role = roleFromRequest(request);
    if (!role) return unauthorized();
    if (role !== "PESQUISADOR") return forbidden();

    const records = cohortObservations(params.code as string);
    const resources: FhirResource[] = records.flatMap((r) => [r.patient, ...r.observations]);
    return HttpResponse.json(bundle(resources));
  }),

  http.get("*/api/projects", ({ request }) => {
    const role = roleFromRequest(request);
    if (!role) return unauthorized();
    if (role !== "PESQUISADOR") return forbidden();

    return HttpResponse.json(bundle(PROJECTS));
  }),
];
