import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('taller_token'));
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('taller_user');
    return u ? JSON.parse(u) : null;
  });

  const login = (jwt, userData) => {
    localStorage.setItem('taller_token', jwt);
    localStorage.setItem('taller_user', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('taller_token');
    localStorage.removeItem('taller_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
