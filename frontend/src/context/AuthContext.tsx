"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface User {
    id: string;
    name: string;
    email: string;
    role: "deaf" | "hearing" | "both";
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string, role: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Try to restore session on mount
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        const stored = localStorage.getItem("user");
        if (token && stored) {
            setAccessToken(token);
            setUser(JSON.parse(stored));
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await api.post("/auth/login", { email, password });
        const { accessToken: token, user: userData } = res.data.data;
        setAccessToken(token);
        setUser(userData);
        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(userData));
    }, []);

    const signup = useCallback(async (name: string, email: string, password: string, role: string) => {
        const res = await api.post("/auth/register", { name, email, password, role });
        const { accessToken: token, user: userData } = res.data.data;
        setAccessToken(token);
        setUser(userData);
        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(userData));
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
        <AuthContext.Provider value={{ user, accessToken, isLoading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
