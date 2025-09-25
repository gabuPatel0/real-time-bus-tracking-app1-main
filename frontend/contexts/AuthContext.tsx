import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import backend from "~backend/client";

interface User {
  id: string;
  email: string;
  name: string;
  role: "driver" | "user";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: "driver" | "user", phone?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoredAuth = async () => {
      const storedToken = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("authUser");
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid by calling /auth/me
        try {
          const authBackend = backend.with({
            auth: () => Promise.resolve({ authorization: `Bearer ${storedToken}` })
          });
          await authBackend.auth.me();
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem("authToken");
          localStorage.removeItem("authUser");
          setToken(null);
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };
    
    loadStoredAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await backend.auth.login({ email, password });
    
    setToken(response.token);
    setUser(response.user as User);
    
    localStorage.setItem("authToken", response.token);
    localStorage.setItem("authUser", JSON.stringify(response.user));
  };

  const signup = async (email: string, password: string, name: string, role: "driver" | "user", phone?: string) => {
    const response = await backend.auth.signup({ email, password, name, role, phone });
    
    setToken(response.token);
    setUser(response.user as User);
    
    localStorage.setItem("authToken", response.token);
    localStorage.setItem("authUser", JSON.stringify(response.user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      signup,
      logout,
      isLoading
    }}>
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

export function useBackend() {
  const { token } = useAuth();
  if (!token) return backend;
  
  return backend.with({
    auth: () => Promise.resolve({ authorization: `Bearer ${token}` })
  });
}
