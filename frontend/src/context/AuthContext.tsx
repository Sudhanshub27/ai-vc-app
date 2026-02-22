"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export interface User {
    id: string;
    name: string;
    email: string;
    role: "deaf" | "hearing" | "both";
    avatar?: string;
    authProvider?: "local" | "google";
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string, role: string) => Promise<void>;
    logout: () => Promise<void>;
    setSession: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        const stored = localStorage.getItem("user");
        if (token && stored) {
            try {
                setAccessToken(token);
                setUser(JSON.parse(stored));
            } catch {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
            }
        }
        setIsLoading(false);
    }, []);

    // Persist helper
    const persist = (userData: User, token: string) => {
        setAccessToken(token);
        setUser(userData);
        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const login = useCallback(async (email: string, password: string) => {
        const res = await api.post("/auth/login", { email, password });
        const { accessToken: token, user: userData } = res.data.data;
        persist(userData, token);
    }, []);

    const signup = useCallback(async (name: string, email: string, password: string, role: string) => {
        const res = await api.post("/auth/register", { name, email, password, role });
        const { accessToken: token, user: userData } = res.data.data;
        persist(userData, token);
    }, []);

    // Used by Google OAuth callback page
    const setSession = useCallback((userData: User, token: string) => {
        persist(userData, token);
    }, []);

    const logout = useCallback(async () => {
        try { await api.post("/auth/logout"); } catch { /* ignore */ }
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        toast.success("Logged out successfully");
    }, []);

    return (
        <AuthContext.Provider value={{ user, accessToken, isLoading, login, signup, logout, setSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
