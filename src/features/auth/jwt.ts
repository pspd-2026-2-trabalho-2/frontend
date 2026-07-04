export type Role = "MEDICO" | "ESTAGIARIO" | "PESQUISADOR";

const CANONICAL_ROLES: Role[] = ["MEDICO", "ESTAGIARIO", "PESQUISADOR"];

interface DecodedToken {
  preferred_username?: string;
  realm_access?: { roles?: string[] };
  exp?: number;
}

export interface AuthUser {
  username: string;
  role: Role;
}

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return decodeURIComponent(
    atob(padded)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(""),
  );
}

export function decodeToken(token: string): DecodedToken | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as DecodedToken;
  } catch {
    return null;
  }
}

export function getExpirationMs(token: string): number | null {
  const decoded = decodeToken(token);
  return decoded?.exp ? decoded.exp * 1000 : null;
}

export function toAuthUser(token: string): AuthUser | null {
  const decoded = decodeToken(token);
  if (!decoded?.preferred_username) return null;

  const role = decoded.realm_access?.roles?.find((r): r is Role =>
    CANONICAL_ROLES.includes(r as Role),
  );
  if (!role) return null;

  return { username: decoded.preferred_username, role };
}
