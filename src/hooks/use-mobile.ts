import { useState, useEffect } from "react";

/**
 * Hook to detect if the current viewport is mobile size
 * Uses the same breakpoint as Tailwind's 'md' (768px)
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mql.matches);
    
    mql.addEventListener("change", onChange);
    setIsMobile(mql.matches);
    
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}