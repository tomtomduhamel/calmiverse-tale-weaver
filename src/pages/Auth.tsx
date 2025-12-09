
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useBetaInvitation } from '@/hooks/beta/useBetaInvitation';
import { useBetaStatus } from '@/hooks/beta/useBetaStatus';
import { useBetaRegistrationComplete } from '@/hooks/beta/useBetaRegistrationComplete';
import { useBetaRegistrationAttempt } from '@/hooks/beta/useBetaRegistrationAttempt';
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
  const { betaInfo, isPending, isRejected, loading: betaLoading, refreshStatus } = useBetaStatus();
  const [inviteCodeChecked, setInviteCodeChecked] = useState(false);
  
  // Finaliser l'inscription beta après confirmation email
  const { isProcessing, isCompleted } = useBetaRegistrationComplete();
  
  // Vérifier si l'utilisateur a une tentative d'inscription beta en cours
  const { hasPendingAttempt, loading: attemptLoading } = useBetaRegistrationAttempt();
  
  // Rafraîchir le statut beta quand l'inscription est complétée
  useEffect(() => {
    if (isCompleted) {
      console.log('[Auth] Beta registration completed, refreshing status');
      refreshStatus();
    }
  }, [isCompleted, refreshStatus]);

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
    if (!loading && !betaLoading && !attemptLoading && !isProcessing && user) {
      // IMPORTANT: Si l'utilisateur a une tentative beta pending mais pas encore de betaInfo,
      // cela signifie qu'il attend la validation admin → rediriger vers /beta-pending
      if (hasPendingAttempt && !betaInfo) {
        console.log('[Auth] User has pending beta attempt, redirecting to /beta-pending');
        navigate('/beta-pending');
        return;
      }
      
      // Si beta testeur en attente de validation
      if (isPending) {
        navigate('/beta-pending');
        return;
      } 
      
      // Si beta testeur rejeté
      if (isRejected) {
        navigate('/beta-pending');
        return;
      }
      
      // Sinon, utilisateur normal ou beta actif → page d'accueil
      navigate('/');
    }
  }, [user, loading, betaLoading, attemptLoading, isProcessing, isPending, isRejected, hasPendingAttempt, betaInfo, navigate]);

  // Afficher le loader pendant le chargement initial ou le traitement de l'inscription beta
  // Note: Pour les utilisateurs non connectés, on n'attend pas betaLoading/attemptLoading
  const isAuthLoading = loading;
  const needsBetaCheck = user && (betaLoading || attemptLoading);
  
  if (isAuthLoading || isProcessing || needsBetaCheck) {
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
