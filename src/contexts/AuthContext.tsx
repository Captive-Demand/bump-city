import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const apply = (nextSession: Session | null) => {
      setSession(nextSession);
      // Only swap the user object reference when the user identity actually
      // changes. Token refresh produces a new Session object with the same
      // user id; preserving the prior reference prevents downstream contexts
      // (RoleContext, ActiveEventContext) from refetching on every refresh.
      const nextId = nextSession?.user?.id ?? null;
      if (nextId !== lastUserIdRef.current) {
        lastUserIdRef.current = nextId;
        setUser(nextSession?.user ?? null);
      }
      if (!initializedRef.current) {
        initializedRef.current = true;
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => apply(nextSession)
    );

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (!initializedRef.current) apply(initial);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
