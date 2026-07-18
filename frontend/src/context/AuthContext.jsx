import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);
const TOKEN_KEY = "genje_token";

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json);
    if (data.exp && Date.now() >= data.exp * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const existing = localStorage.getItem(TOKEN_KEY);
    return existing ? decodeToken(existing) : null;
  });
  // Richer profile (name, linked member role/standing) — fetched separately
  // since the JWT itself only carries { id, role }.
  const [me, setMe] = useState(null);

  const refreshMe = useCallback(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return Promise.resolve(null);
    return authApi.getMe().then((data) => { setMe(data); return data; }).catch(() => null);
  }, []);

  useEffect(() => { if (user) refreshMe(); }, [user, refreshMe]);

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(decodeToken(data.token));
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setMe(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      me,
      refreshMe,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      // The member-side role (treasurer/chairperson/secretary/committee/member),
      // only meaningful once an admin has linked this login to a roster entry.
      memberRole: me?.member_role || null,
      // Permission tier, mirroring the backend's roleMiddleware.allowRoles
      // matrix exactly — admin always passes, otherwise it's whichever
      // chama role is linked. Kept in sync manually: if the backend
      // permission matrix changes, update these too.
      canViewFinance: user?.role === "admin" || ["treasurer", "chairperson", "secretary"].includes(me?.member_role),
      canManageFinance: user?.role === "admin" || me?.member_role === "treasurer",
      canManageMeetings: user?.role === "admin" || ["secretary", "chairperson"].includes(me?.member_role),
      login,
      logout,
    }),
    [token, user, me, refreshMe, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
