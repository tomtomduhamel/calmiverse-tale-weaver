import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { AlertCircle, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginFormProps {
  isRegister: boolean;
  inviteCode?: string | null;
  onSwitchMode?: (isRegister: boolean) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  isRegister, 
  inviteCode = null,
  onSwitchMode 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Écran d'attente email
  const [pendingEmailConfirmation, setPendingEmailConfirmation] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resendConfirmationEmail } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const passwordTooWeak = isRegister && password.length > 0 && password.length < 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegister) {
      if (password.length < 8) {
        toast({
          title: "Mot de passe trop court",
          description: "Le mot de passe doit contenir au moins 8 caractères.",
          variant: "destructive",
        });
        return;
      }
      if (!acceptTerms) {
        toast({
          title: "Conditions requises",
          description: "Vous devez accepter les conditions d'utilisation et la politique de confidentialité.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    setGoogleAuthError(false);

    try {
      if (!isRegister) {
        // Connexion
        await signInWithEmail(email, password);
        navigate('/app');
      } else {
        // Inscription
        const result = await signUpWithEmail(email, password, inviteCode);
        
        if (inviteCode) {
          navigate('/beta-pending');
        } else if (result?.needsEmailConfirmation) {
          // L'email nécessite une confirmation explicite : on affiche l'écran dédié
          setPendingEmailConfirmation(true);
        } else {
          // Session immédiate (ex: confirmation auto)
          navigate('/app');
        }
      }
    } catch (error: any) {
      console.error('[Auth Form] Error:', error);
      toast({
        title: isRegister ? "Échec de l'inscription" : "Échec de la connexion",
        description: error.message || "Une erreur est survenue. Veuillez vérifier vos informations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setGoogleAuthError(false);
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setGoogleAuthError(true);
      toast({
        title: "Échec de la connexion avec Google",
        description: error.message || "Une erreur s'est produite lors de la connexion avec Google.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || isResending || !email) return;
    setIsResending(true);
    try {
      await resendConfirmationEmail(email);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      toast({
        title: "Erreur d'envoi",
        description: err.message || "Impossible de renvoyer l'email pour le moment.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  // ── Écran d'attente de confirmation email ─────────────────────────────────
  if (pendingEmailConfirmation) {
    return (
      <div className="space-y-6 text-center py-2 animate-fade-in">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-breathe">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h3 className="font-display italic text-2xl text-foreground">
            Vérifiez votre boîte mail
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Un lien de confirmation a été envoyé à :
          </p>
          <div className="inline-block px-3 py-1 bg-muted rounded-full text-sm font-medium text-foreground">
            {email}
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Cliquez sur le lien reçu pour activer votre compte et commencer vos histoires.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleResendEmail}
            disabled={isResending || resendCooldown > 0}
          >
            <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
            {resendCooldown > 0 
              ? `Renvoyer l'email (${resendCooldown}s)` 
              : "Renvoyer l'email de confirmation"}
          </Button>

          <div className="flex flex-col gap-2 pt-2 text-xs">
            <button
              type="button"
              onClick={() => setPendingEmailConfirmation(false)}
              className="text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
            >
              Modifier l'adresse email
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingEmailConfirmation(false);
                onSwitchMode?.(false);
              }}
              className="text-primary hover:underline font-medium"
            >
              Déjà confirmé ? Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {googleAuthError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            La connexion avec Google a échoué. Veuillez réessayer ou utiliser votre adresse email.
          </AlertDescription>
        </Alert>
      )}

      {/* Bouton Google 1-clic prioritaire */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 border-border/80 hover:bg-muted/50 font-medium transition-all shadow-sm flex items-center justify-center gap-2"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span>{isRegister ? "S'inscrire en 1 clic avec Google" : "Continuer avec Google"}</span>
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground font-medium">Ou avec un email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground/80">Adresse email</label>
          <Input
            type="email"
            placeholder="exemple@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isLoading}
            className="w-full h-11"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground/80">Mot de passe</label>
            {!isRegister && (
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
            )}
          </div>
          <Input
            type="password"
            placeholder={isRegister ? "8 caractères minimum" : "••••••••"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isRegister ? 8 : undefined}
            autoComplete={isRegister ? "new-password" : "current-password"}
            disabled={isLoading}
            className="w-full h-11"
          />
          {passwordTooWeak && (
            <p className="text-xs text-destructive mt-1">Le mot de passe doit comporter au moins 8 caractères.</p>
          )}
        </div>

        {isRegister && (
          <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer pt-1 leading-snug">
            <Checkbox
              checked={acceptTerms}
              onCheckedChange={(v) => setAcceptTerms(Boolean(v))}
              disabled={isLoading}
              className="mt-0.5"
            />
            <span>
              J'accepte les{" "}
              <Link to="/terms" target="_blank" className="text-primary underline">conditions d'utilisation</Link>
              {" "}et la{" "}
              <Link to="/privacy-policy" target="_blank" className="text-primary underline">politique de confidentialité</Link>.
            </span>
          </label>
        )}

        <Button
          type="submit"
          className="w-full h-11 text-base font-semibold shadow-glow-primary hover:shadow-floating transition-all gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Traitement en cours...
            </span>
          ) : isRegister ? (
            <>
              Créer mon compte gratuitement
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;
