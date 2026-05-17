import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useIsSuperAdmin = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc("is_super_admin");
        if (!isMounted) return;
        if (error) throw error;
        setIsSuperAdmin(Boolean(data));
      } catch {
        setIsSuperAdmin(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false };
  }, []);

  return { isSuperAdmin, loading };
};
