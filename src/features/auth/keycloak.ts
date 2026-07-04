const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;
const REALM = import.meta.env.VITE_KEYCLOAK_REALM;
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

const TOKEN_ENDPOINT = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;
const LOGOUT_ENDPOINT = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout`;

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export class KeycloakAuthError extends Error {}

async function requestToken(body: URLSearchParams): Promise<TokenResponse> {
  body.set("client_id", CLIENT_ID);

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new KeycloakAuthError("Usuário ou senha inválidos.");
    }
    throw new KeycloakAuthError("Não foi possível autenticar. Tente novamente.");
  }

  return (await response.json()) as TokenResponse;
}

export function loginWithPassword(username: string, password: string) {
  return requestToken(
    new URLSearchParams({
      grant_type: "password",
      username,
      password,
    }),
  );
}

export function refreshAccessToken(refreshToken: string) {
  return requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  );
}

export async function revokeSession(refreshToken: string): Promise<void> {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  });
  try {
    await fetch(LOGOUT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    // logout local deve prosseguir mesmo se a revogação no Keycloak falhar
  }
}
