import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const TOKEN_KEY = "authToken";
const ROLE_KEY = "authRole";
const PROFILE_KEY = "authProfile";

function readStoredAuth() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const role = localStorage.getItem(ROLE_KEY) || "student";
    const profileRaw = localStorage.getItem(PROFILE_KEY);
    const profile = profileRaw ? JSON.parse(profileRaw) : {};

    return {
      isAuthenticated: Boolean(token),
      token,
      role,
      profile,
    };
  } catch {
    return {
      isAuthenticated: false,
      token: "",
      role: "student",
      profile: {},
    };
  }
}

export function AuthProvider({ children }) {
  const [{ isAuthenticated, token, role, profile }, setAuthState] = useState(readStoredAuth);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = (nextToken, nextProfile = {}) => {
    const nextRole = String(nextProfile.role || role || "student").toLowerCase();
    const nextUserProfile = {
      role: nextRole,
      name: nextProfile.name || profile?.name || "",
      email: nextProfile.email || profile?.email || "",
    };

    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(ROLE_KEY, nextRole);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(nextUserProfile));
    setAuthState({
      isAuthenticated: true,
      token: nextToken,
      role: nextRole,
      profile: nextUserProfile,
    });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setAuthState({
      isAuthenticated: false,
      token: "",
      role: "student",
      profile: {},
    });
  };

  const getToken = () => token || localStorage.getItem(TOKEN_KEY);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout, getToken, role, profile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
