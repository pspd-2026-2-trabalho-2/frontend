import type { Role } from "./jwt";

export const ROLE_LABELS: Record<Role, string> = {
  MEDICO: "Médico",
  ESTAGIARIO: "Estagiário",
  PESQUISADOR: "Pesquisador",
};
