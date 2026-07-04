import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { loginWithPassword, refreshAccessToken, revokeSession } from "./keycloak";
import { getExpirationMs, toAuthUser, type AuthUser } from "./jwt";
import { getAccessToken, registerUnauthorizedHandler, setAccessToken } from "./tokenStore";

const ACCESS_TOKEN_KEY = "hu_access_token";
const REFRESH_TOKEN_KEY = "hu_refresh_token";

// Renova a sessão um pouco antes do token expirar, evitando 401 em requisições in-flight.
const REFRESH_MARGIN_MS = 30_000;

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTokenRef = useRef<string | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  const applySession = useCallback((accessToken: string, refreshToken: string) => {
    const authUser = toAuthUser(accessToken);
    if (!authUser) {
      throw new Error(
        "Token recebido não contém uma role reconhecida (MEDICO/ESTAGIARIO/PESQUISADOR).",
      );
    }

    setAccessToken(accessToken);
    refreshTokenRef.current = refreshToken;
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    setUser(authUser);

    return authUser;
  }, []);

  const clearSession = useCallback(() => {
    clearRefreshTimer();
    setAccessToken(null);
    refreshTokenRef.current = null;
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
  }, [clearRefreshTimer]);

  const logout = useCallback(() => {
    const refreshToken = refreshTokenRef.current;
    clearSession();
    if (refreshToken) void revokeSession(refreshToken);
  }, [clearSession]);

  const scheduleRefresh = useCallback(
    (accessToken: string) => {
      clearRefreshTimer();
      const expiresAtMs = getExpirationMs(accessToken);
      if (!expiresAtMs) return;

      const delay = Math.max(expiresAtMs - Date.now() - REFRESH_MARGIN_MS, 5_000);
      refreshTimer.current = setTimeout(async () => {
        const refreshToken = refreshTokenRef.current;
        if (!refreshToken) return;
        try {
          const tokens = await refreshAccessToken(refreshToken);
          applySession(tokens.access_token, tokens.refresh_token);
          scheduleRefresh(tokens.access_token);
        } catch {
          logout();
        }
      }, delay);
    },
    [applySession, clearRefreshTimer, logout],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      const tokens = await loginWithPassword(username, password);
      applySession(tokens.access_token, tokens.refresh_token);
      scheduleRefresh(tokens.access_token);
    },
    [applySession, scheduleRefresh],
  );

  // Restaura a sessão de um reload de página (tokens vivem em sessionStorage).
  useEffect(() => {
    registerUnauthorizedHandler(logout);

    const storedAccess = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    const storedRefresh = sessionStorage.getItem(REFRESH_TOKEN_KEY);

    async function restore() {
      if (!storedAccess || !storedRefresh) {
        setIsLoading(false);
        return;
      }

      const expiresAtMs = getExpirationMs(storedAccess);
      const stillValid = expiresAtMs && expiresAtMs - Date.now() > REFRESH_MARGIN_MS;

      try {
        if (stillValid) {
          applySession(storedAccess, storedRefresh);
          scheduleRefresh(storedAccess);
        } else {
          const tokens = await refreshAccessToken(storedRefresh);
          applySession(tokens.access_token, tokens.refresh_token);
          scheduleRefresh(tokens.access_token);
        }
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    }

    void restore();

    return () => clearRefreshTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null && getAccessToken() !== null,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
