import React, { createContext, useContext, useEffect, useState } from 'react';
import { Api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => Api.getCurrentUser());
  const [loading, setLoading] = useState(false);

  async function refreshUser() {
    if (!Api.isLoggedIn()) return;
    try {
      const fresh = await Api.getMe();
      setUser(fresh);
    } catch {
      // Network hiccup or session expired — keep the cached copy and
      // let the next request's 401 handling deal with a real logout.
    }
  }

  useEffect(() => {
    if (Api.isLoggedIn() && !user) {
      setUser(Api.getCurrentUser());
    }
    // Always re-check permissions against the server on mount, and again
    // whenever the tab regains focus — an admin may have changed this
    // employee's permissions in another session while this tab was open.
    refreshUser();
    window.addEventListener('focus', refreshUser);
    return () => window.removeEventListener('focus', refreshUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email, password) {
    setLoading(true);
    try {
      const u = await Api.login(email, password);
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await Api.logout();
    setUser(null);
  }

  function hasPermission(permission) {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return !!(user.permissions && user.permissions[permission]);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, refreshUser, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
