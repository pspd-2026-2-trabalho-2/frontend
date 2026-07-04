/**
 * Espelho, fora do React, do access token atual — permite que `lib/api.ts`
 * injete o header Authorization sem depender de contexto/hooks, e que um
 * 401 da API dispare o logout do AuthProvider sem acoplamento direto.
 */
let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function registerUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized(): void {
  unauthorizedHandler?.();
}
