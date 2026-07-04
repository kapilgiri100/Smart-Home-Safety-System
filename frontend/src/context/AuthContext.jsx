import { createContext, useContext, useEffect, useState } from "react";
import * as authService from "../services/authService";
import { socket } from "../socket/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Keep the realtime connection open only while authenticated
    if (user) {
      socket.connect();
    }
    return () => {
      socket.disconnect();
    };
  }, [user]);

  async function login(email, password) {
    setLoading(true);
    setError(null);
    try {
      const { token, user: loggedInUser } = await authService.login(email, password);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Unable to log in.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function register(name, email, password) {
    setLoading(true);
    setError(null);
    try {
      const { token, user: registeredUser } = await authService.register(name, email, password);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(registeredUser));
      setUser(registeredUser);
      return registeredUser;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Unable to create account.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
