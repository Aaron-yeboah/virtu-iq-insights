import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkAndValidateSession(currentSession: Session | null) {
      if (!currentSession?.user) {
        if (active) {
          setSession(null);
          setLoading(false);
        }
        return;
      }

      // Verify that the user profile actually exists in the database
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", currentSession.user.id)
          .maybeSingle();

        if (!profile) {
          // Ghost/zombie session: user was deleted by admin. Auto-evict!
          await supabase.auth.signOut();
          if (active) {
            setSession(null);
            setLoading(false);
          }
          return;
        }
      } catch {
        // network issue, keep cached session
      }

      if (active) {
        setSession(currentSession);
        setLoading(false);
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      void checkAndValidateSession(next);
    });

    void supabase.auth.getSession().then(({ data }) => {
      void checkAndValidateSession(data.session);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const user: User | null = session?.user ?? null;
  return { session, user, loading, isAuthenticated: !!user };
}
