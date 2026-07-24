import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import type { Profile, UserRole } from "@/types/database";
import { toast } from "sonner";

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
};

type Ctx = {
  ready: boolean;
  user: AuthUser | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetchProfile(session.user.id, session.user.email!);
        } else {
          setUser(null);
          setReady(true);
        }
      } catch (err) {
        console.error("Failed to get session", err);
        setReady(true);
      }
    }

    async function fetchProfile(userId: string, email: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const profile = data as Profile | null;
      if (profile && mounted) {
        if (!profile.is_active && profile.role !== 'admin') {
          await supabase.auth.signOut();
          setUser(null);
          toast.error("Your account has been suspended by an administrator.", { duration: 5000 });
        } else {
          setUser({
            id: userId,
            email,
            full_name: profile.full_name,
            phone: profile.phone || undefined,
            role: profile.role,
          });
        }
      }
      if (mounted) setReady(true);
    }

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          setUser(null);
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          fetchProfile(session.user.id, session.user.email!);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<Ctx>(() => ({
    ready, user, signOut,
  }), [ready, user, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
