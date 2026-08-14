import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Live-updates a user's payment state the moment an admin approves/rejects it,
 * so no page reload is ever needed.
 */
export function usePaymentRealtime(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`payments-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments", filter: `user_id=eq.${userId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["payments", userId] });
          void queryClient.invalidateQueries({ queryKey: ["registration-payment", userId] });
          void queryClient.invalidateQueries({ queryKey: ["profile", userId] });
          void queryClient.invalidateQueries({ queryKey: ["credit-history", userId] });
          void queryClient.invalidateQueries({ queryKey: ["verdict-limit", userId] });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["profile", userId] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
