import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useBetaInvitation } from '@/hooks/beta/useBetaInvitation';
import { useBetaStatus } from '@/hooks/beta/useBetaStatus';
import { useBetaRegistrationComplete } from '@/hooks/beta/useBetaRegistrationComplete';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import { SimpleLoader } from '@/components/ui/SimpleLoader';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useSupabaseAuth();
  const { checkInvitationCode, storeInviteCode, status } = useBetaInvitation();
  const { betaInfo, isPending, isRejected, loading: betaLoading, refreshStatus } = useBetaStatus();
  const [inviteCodeChecked, setInviteCodeChecked] = useState(false);

  const initialTab = (status.isValid || searchParams.get('mode') === 'signup') ? "register" : "login";
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  // Finaliser l'inscription beta après confirmation email
  const { isProcessing, isCompleted } = useBetaRegistrationComplete();

  // Rafraîchir le statut beta quand l'inscription est complétée
  useEffect(() => {
    if (isCompleted) {
      console.log('[Auth] Beta registration completed, refreshing status');
      refreshStatus();
    }
  }, [isCompleted, refreshStatus]);

  // Synchroniser l'onglet initial si les paramètres d'URL changent
  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setActiveTab('register');
    }
  }, [searchParams]);

  // Détecter le code d'invitation ou le flag VIP dans l'URL
  useEffect(() => {
    const inviteCode = searchParams.get('invite');
    const isVip = searchParams.get('vip') === 'true';

    // Si c'est un accès VIP, on court-circuite la vérification
    if (isVip && !inviteCodeChecked) {
      console.log('[Auth] VIP access detected');
      checkInvitationCode('VIP').then(isValid => {
        if (isValid) {
          storeInviteCode('VIP');
          setActiveTab('register');
        }
        setInviteCodeChecked(true);
      });
    } else if (inviteCode && !inviteCodeChecked) {
      console.log('[Auth] Beta invite code detected:', inviteCode);
      checkInvitationCode(inviteCode).then(isValid => {
        if (isValid) {
          storeInviteCode(inviteCode);
          setActiveTab('register');
        }
        setInviteCodeChecked(true);
      });
    } else if (!inviteCode && !isVip) {
      setInviteCodeChecked(true);
    }
  }, [searchParams, inviteCodeChecked, checkInvitationCode, storeInviteCode]);

  // Rediriger les utilisateurs selon leur statut
  React.useEffect(() => {
    if (!loading && !betaLoading && !isProcessing && user) {
      // Si beta testeur en attente de validation ou rejeté → page d'attente
      if (isPending || isRejected) {
        navigate('/beta-pending', { replace: true });
        return;
      }
      
      // Sinon (beta actif, expiré, ou client direct/admin) → /app
      navigate('/app', { replace: true });
    }
  }, [user, loading, betaLoading, isProcessing, isPending, isRejected, navigate]);

  // Afficher le loader pendant le chargement initial
  const isAuthLoading = loading;
  const needsBetaCheck = user && betaLoading;
  
  if (isAuthLoading || isProcessing || needsBetaCheck) {
    return <SimpleLoader />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-hero p-4 relative overflow-hidden">
      <div aria-hidden className="absolute -top-32 -left-32 w-96 h-96 bg-primary-soft/20 rounded-full blur-3xl animate-drift" />
      <div aria-hidden className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent/25 rounded-full blur-3xl animate-drift" style={{ animationDelay: '2s' }} />
      
      <Card className="w-full max-w-md relative z-10 shadow-floating rounded-3xl border-primary-soft/20 bg-card/85 backdrop-blur-xl transition-all">
        <CardHeader className="text-center space-y-2 pb-2">
          {status.isValid && status.code && (
            <Badge variant="secondary" className="mx-auto mb-2 gap-1 px-3 py-1 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3.5 w-3.5" />
              Invitation Beta Testeur
            </Badge>
          )}
          <Link to="/" className="inline-flex items-center justify-center gap-2 mx-auto hover:opacity-80 transition-opacity">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-display italic text-3xl text-foreground tracking-tight">Calmi</span>
          </Link>
          <CardDescription className="text-sm text-muted-foreground">
            {activeTab === 'register' 
              ? "Créez votre compte en quelques secondes"
              : "Connectez-vous pour retrouver toutes vos histoires"
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {status.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status.error}</AlertDescription>
            </Alert>
          )}
          
          {status.isValid && status.code && (
            <Alert className="bg-primary/5 border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs text-foreground/90 leading-relaxed">
                Code <strong className="text-primary">{status.code}</strong> validé. Créez votre compte pour rejoindre le programme.
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/60 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg text-xs sm:text-sm font-medium">Connexion</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg text-xs sm:text-sm font-medium">Inscription</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-4 focus-visible:outline-none">
              <LoginForm 
                isRegister={false} 
                onSwitchMode={(isReg) => setActiveTab(isReg ? "register" : "login")} 
              />
            </TabsContent>
            
            <TabsContent value="register" className="mt-4 focus-visible:outline-none">
              <LoginForm 
                isRegister={true} 
                inviteCode={status.code} 
                onSwitchMode={(isReg) => setActiveTab(isReg ? "register" : "login")} 
              />
            </TabsContent>
          </Tabs>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Retour à l'accueil
            </button>
          </div>
        </CardContent>

        <CardFooter className="text-center text-[11px] text-muted-foreground/80 justify-center border-t border-border/40 py-3 mt-2">
          Essai gratuit 30 jours sans engagement · Données 100% sécurisées
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
