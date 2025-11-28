
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useBetaInvitation } from '@/hooks/beta/useBetaInvitation';
import { useBetaStatus } from '@/hooks/beta/useBetaStatus';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, AlertCircle } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import { SimpleLoader } from '@/components/ui/SimpleLoader';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useSupabaseAuth();
  const { checkInvitationCode, storeInviteCode, status } = useBetaInvitation();
  const { isPending, isRejected, loading: betaLoading } = useBetaStatus();
  const [inviteCodeChecked, setInviteCodeChecked] = useState(false);

  // Détecter le code d'invitation dans l'URL
  useEffect(() => {
    const inviteCode = searchParams.get('invite');
    if (inviteCode && !inviteCodeChecked) {
      console.log('[Auth] Beta invite code detected:', inviteCode);
      checkInvitationCode(inviteCode).then(isValid => {
        if (isValid) {
          storeInviteCode(inviteCode);
        }
        setInviteCodeChecked(true);
      });
    } else if (!inviteCode) {
      setInviteCodeChecked(true);
    }
  }, [searchParams, inviteCodeChecked]);

  // Rediriger les utilisateurs selon leur statut
  React.useEffect(() => {
    if (!loading && !betaLoading && user) {
      // Si beta testeur en attente, rediriger vers la page d'attente
      if (isPending) {
        navigate('/beta-pending');
      } 
      // Si rejeté, rediriger aussi vers la page d'info
      else if (isRejected) {
        navigate('/beta-pending');
      }
      // Sinon, utilisateur normal ou beta actif → page d'accueil
      else {
        navigate('/');
      }
    }
  }, [user, loading, betaLoading, isPending, isRejected, navigate]);

  if (loading) {
    return <SimpleLoader />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          {status.isValid && status.code && (
            <Badge variant="secondary" className="mx-auto mb-2 gap-1 px-3 py-1">
              <Sparkles className="h-3 w-3" />
              Invitation Beta Testeur
            </Badge>
          )}
          <CardTitle className="text-2xl font-bold">Bienvenue sur Calmi</CardTitle>
          <CardDescription>
            {status.isValid && status.code 
              ? "Créez votre compte pour accéder au programme beta"
              : "Connectez-vous pour créer des histoires personnalisées pour vos enfants"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status.error}</AlertDescription>
            </Alert>
          )}
          
          {status.isValid && status.code && (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <p className="font-medium mb-1">Code d'invitation valide !</p>
                <p>
                  Créez votre compte pour rejoindre le programme beta. 
                  Votre demande sera validée par notre équipe avant d'accéder aux fonctionnalités.
                </p>
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue={status.isValid ? "register" : "login"}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <LoginForm isRegister={false} />
            </TabsContent>
            <TabsContent value="register" className="mt-4">
              <LoginForm isRegister={true} inviteCode={status.code} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          En vous connectant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
