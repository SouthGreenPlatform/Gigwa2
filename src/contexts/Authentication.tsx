import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import axios from 'axios';
import { loginRequest } from "../pages/Login";
import endpoints from "../endpoints";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, token: string, expiresInSeconds?: number) => void;
  logout: () => void;
  username: string | null;
  token: string | null;
  isAuthReady: boolean;
  connectionError: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  useEffect(() => {
    onConnectionError = setConnectionError;
    return () => { onConnectionError = null; };
  }, []);

  // Load from localStorage on first render, or exchange CAS session for a token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isCasReturn = params.get('casAuth') === '1';

    if (isCasReturn) {
      params.delete('casAuth');
      const cleanUrl = window.location.pathname + (params.size > 0 ? '?' + params.toString() : '');
      window.history.replaceState({}, '', cleanUrl);
    }

    const storedUsername = localStorage.getItem("username");
    const storedToken = localStorage.getItem("auth_token");
    const storedExpiresAt = localStorage.getItem("token_expires_at");
    const now = Date.now();

    if (!isCasReturn && storedToken && storedUsername && storedExpiresAt && now < parseInt(storedExpiresAt)) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
      setToken(storedToken);
      setIsAuthReady(true);
    } else {
      localStorage.removeItem("username");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("token_expires_at");
      (async () => {
        try {
          const { token } = await loginRequest();
          const userInfo = await axios.get(endpoints.USER_INFO_URL, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
          const username = userInfo?.data.username;
          //console.debug("[Auth] userInfo:", userInfo?.data, "| username:", JSON.stringify(username));
          login(username && username !== "anonymousUser" ? username : "", token, 3600);
        } catch (e) {
          console.error(e);
        } finally {
          setIsAuthReady(true);
        }
      })();
    }
  }, []);

  // Automatically logout when token expires
  useEffect(() => {
    const storedExpiresAt = localStorage.getItem("token_expires_at");
    if (token && storedExpiresAt) {
      const timeout = parseInt(storedExpiresAt) - Date.now();
      if (timeout > 0) {
        const timer = setTimeout(() => {
          logout();
        }, timeout);
        return () => clearTimeout(timer);
      } else {
        logout();
      }
    }
  }, [token]);

  const login = (username: string, token: string, expiresInSeconds: number = 3600) => {
    const expiresAt = Date.now() + expiresInSeconds * 1000;

    setIsAuthenticated(username !== "");
    setUsername(username === "" ? null : username);
    setToken(token);

    localStorage.setItem("username", username);
    localStorage.setItem("auth_token", token);
    localStorage.setItem("token_expires_at", expiresAt.toString());
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    setToken(null);
    localStorage.removeItem("username");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token_expires_at");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, username, token, isAuthReady, connectionError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

let loginPromise: Promise<void> | null = null;
let loginError: Error | null = null;
let onConnectionError: ((err: Error) => void) | null = null;

const neverResolves = new Promise<void>(() => {}); // used to suspend indefinitely after an error

export function useApi() {
  const { token, login } = useAuth();

  // If token is missing, start loginRequest only once and wait for it
  if (!token) {
    if (loginError) throw neverResolves; // stay suspended — AuthGate will show the error UI
    if (!loginPromise) {
      loginPromise = loginRequest().then(data => {
        login(data.username ?? "", data.token, 3600); // token valid for 1 hour
        loginError = null;
      }).catch(err => {
        loginError = err instanceof Error ? err : new Error("Failed to connect to backend");
        onConnectionError?.(loginError);
      }).finally(() => {
        loginPromise = null;
      });
    }
    throw loginPromise; // Suspense fallback or handle with error boundary
  }

  const instance = axios.create({
    headers: { Authorization: `Bearer ${token}` },
  });

  return instance;
}

export function AuthGate({ children, fallback = <div>Loading authentication...</div> }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  const { isAuthReady, connectionError } = useAuth();
  if (connectionError) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="alert alert-danger" role="alert">
        <strong>Cannot connect to backend.</strong> {connectionError.message}
      </div>
    </div>
  );
  if (!isAuthReady) return <>{fallback}</>;
  return <>{children}</>;
}
