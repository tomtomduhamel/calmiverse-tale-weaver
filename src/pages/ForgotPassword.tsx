import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast({
        title: "Email envoyé",
        description: "Consultez votre boîte de réception pour réinitialiser votre mot de passe.",
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible d'envoyer l'email de réinitialisation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-primary/10 to-background">
      <Card className="w-full max-w-md p-6 space-y-6">
        <Link to="/auth" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Retour à la connexion
        </Link>
        <div className="text-center">
          <Mail className="h-10 w-10 mx-auto text-primary mb-2" />
          <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        {sent ? (
          <div className="text-center text-sm space-y-3">
            <p>Si un compte existe pour <strong>{email}</strong>, un email vient d'être envoyé.</p>
            <p className="text-muted-foreground">Pensez à vérifier vos spams.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer le lien"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
