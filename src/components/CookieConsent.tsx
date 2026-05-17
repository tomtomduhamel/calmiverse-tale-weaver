import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "calmi-cookie-consent";

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, "accepted"); } catch {}
    setVisible(false);
  };

  const refuse = () => {
    try { localStorage.setItem(STORAGE_KEY, "essential-only"); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-3 sm:p-4 pb-safe">
      <div className="mx-auto max-w-3xl bg-card border border-border shadow-2xl rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Cookie className="h-6 w-6 text-primary shrink-0" />
        <div className="text-sm text-foreground flex-1">
          Calmi utilise uniquement des cookies essentiels pour votre session et vos préférences.
          Aucun tracking publicitaire.{" "}
          <Link to="/cookies" className="underline text-primary">En savoir plus</Link>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={refuse} className="flex-1 sm:flex-none">
            Essentiels seulement
          </Button>
          <Button size="sm" onClick={accept} className="flex-1 sm:flex-none">
            J'accepte
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
