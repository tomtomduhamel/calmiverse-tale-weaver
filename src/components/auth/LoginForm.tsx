
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginFormProps {
  isRegister: boolean;
  inviteCode?: string | null;
}

const LoginForm = ({ isRegister: initialIsRegister = false, inviteCode = null }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(!initialIsRegister);
  const [isLoading, setIsLoading] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const passwordTooWeak = !isLogin && password.length > 0 && password.length < 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
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

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, inviteCode);
        if (inviteCode) {
          navigate('/beta-pending');
        } else {
          navigate('/app');
        }
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: isLogin ? "Échec de la connexion" : "Échec de l'inscription",
        description: error.message || "Une erreur est survenue. Veuillez réessayer.",
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

  return (
    <Card className="w-full max-w-md p-6 space-y-6 bg-white/80 backdrop-blur-sm">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {isLogin ? 'Bienvenue sur Calmi' : 'Créez votre compte Calmi'}
        </p>
      </div>

      {googleAuthError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            La connexion avec Google a échoué. Veuillez réessayer ou utiliser l'email et le mot de passe.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="w-full"
          />
        </div>
        <div>
          <Input
            type="password"
            placeholder={isLogin ? "Mot de passe" : "Mot de passe (8 caractères minimum)"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isLogin ? undefined : 8}
            disabled={isLoading}
            className="w-full"
          />
          {passwordTooWeak && (
            <p className="text-xs text-destructive mt-1">8 caractères minimum.</p>
          )}
        </div>

        {!isLogin && (
          <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
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

        {isLogin && (
          <div className="text-right">
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Ou</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
          <path d="M1 1h22v22H1z" fill="none" />
        </svg>
        Continuer avec Google
      </Button>

      <div className="text-center">
        <Button
          variant="link"
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm"
          disabled={isLoading}
        >
          {isLogin ? 'Créer un compte' : 'Déjà un compte ? Se connecter'}
        </Button>
      </div>
    </Card>
  );
};

export default LoginForm;
