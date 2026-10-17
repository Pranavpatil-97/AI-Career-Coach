import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, signIn as requestSignIn, signOut as requestSignOut, signUp as requestSignUp } from "../lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState("");

  const refreshUser = useCallback(async () => {
    setStatus("checking");
    setError("");
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setStatus(currentUser ? "authenticated" : "anonymous");
    } catch (err) {
      setUser(null);
      setStatus("error");
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const signIn = useCallback(async (credentials) => {
    const signedInUser = await requestSignIn(credentials);
    setUser(signedInUser);
    setStatus("authenticated");
    setError("");
    return signedInUser;
  }, []);

  const signUp = useCallback(async (details) => {
    const newUser = await requestSignUp(details);
    setUser(newUser);
    setStatus("authenticated");
    setError("");
    return newUser;
  }, []);

  const signOut = useCallback(async () => {
    await requestSignOut();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(() => ({ user, status, error, signIn, signUp, signOut, refreshUser }), [
    user, status, error, signIn, signUp, signOut, refreshUser,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
