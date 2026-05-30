import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Loader2 } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    // 1. Gestion du flux PKCE (?code=...)
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    const handlePkceAndSession = async () => {
      console.log("[ResetPassword] Initialisation de la réinitialisation...", {
        hasCode: !!code,
        hash: window.location.hash ? "Présent" : "Absent",
        pathname: window.location.pathname
      });

      try {
        if (code) {
          console.log("[ResetPassword] Code PKCE détecté, échange contre session...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[ResetPassword] Erreur lors de l'échange du code PKCE:", error);
            toast({
              title: "Lien invalide ou expiré",
              description: error.message || "Le lien de récupération n'est plus valide ou a déjà été utilisé.",
              variant: "destructive"
            });
            return;
          }
          if (data?.session && active) {
            console.log("[ResetPassword] Échange PKCE réussi. Utilisateur connecté:", data.session.user.id);
            setReady(true);
            
            // Nettoyage de l'URL pour supprimer le paramètre 'code' afin d'éviter une double consommation au rechargement
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          }
        } else {
          // 2. Fallback sur session existante ou flux Implicit (#access_token=...)
          const { data: { session } } = await supabase.auth.getSession();
          console.log("[ResetPassword] Vérification session existante...", { hasSession: !!session });
          if (session && active) {
            setReady(true);
          }
        }
      } catch (err: any) {
        console.error("[ResetPassword] Erreur inattendue d'échange PKCE/Session:", err);
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    };

    handlePkceAndSession();

    // 3. Écoute des changements d'état d'authentification (utile pour le flux Implicit)
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[ResetPassword] Changement d'état auth détecté:", event, { hasSession: !!session });
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (active) {
          setReady(true);
          setInitializing(false);
        }
      }
    });

    return () => {
      active = false;
      if (sub && typeof sub.subscription !== 'undefined') {
        try {
          sub.subscription.unsubscribe();
          console.log("[ResetPassword] Écouteur de session désinscrit avec succès");
        } catch (err) {
          console.error("[ResetPassword] Erreur lors de la désinscription de l'écouteur:", err);
        }
      }
    };
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Mot de passe trop court", description: "8 caractères minimum.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Mots de passe différents", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Mot de passe mis à jour", description: "Vous êtes maintenant connecté." });
      navigate("/app");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-primary/10 to-background">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <KeyRound className="h-10 w-10 mx-auto text-primary mb-2" />
          <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
          <p className="text-sm text-muted-foreground mt-1">Choisissez un mot de passe sécurisé (8+ caractères).</p>
        </div>

        {initializing ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              Vérification de votre lien de récupération...
            </p>
          </div>
        ) : !ready ? (
          <p className="text-center text-sm text-muted-foreground">
            Lien invalide ou expiré. Demandez un nouveau lien depuis la page « Mot de passe oublié ».
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={loading}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
