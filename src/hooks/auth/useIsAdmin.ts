import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useIsAdmin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc("is_admin");
        if (!isMounted) return;
        if (error) throw error;
        setIsAdmin(Boolean(data));
      } catch (e: any) {
        setError(e.message ?? "Erreur lors de la vérification admin");
        setIsAdmin(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    check();
    return () => { isMounted = false };
  }, []);

  return { isAdmin, loading, error };
};
