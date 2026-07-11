import React, { createContext, useContext, useEffect, useState } from "react";
import pb from "@/lib/pocketbaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.record);

  useEffect(() => {
    const unsub = pb.authStore.onChange((_token, record) => setUser(record));
    return unsub;
  }, []);

  const value = {
    user,
    isAuthed: pb.authStore.isValid,
    isAdmin: user?.role === "admin",
    login: (email, password) => pb.collection("users").authWithPassword(email, password),
    signup: async (email, password, name) => {
      await pb.collection("users").create({
        email,
        password,
        passwordConfirm: password,
        name,
        plan: "free",
        role: "user",
      });
      return pb.collection("users").authWithPassword(email, password);
    },
    loginWithGoogle: () => pb.collection("users").authWithOAuth2({ provider: "google" }),
    requestPasswordReset: (email) => pb.collection("users").requestPasswordReset(email),
    logout: () => pb.authStore.clear(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
