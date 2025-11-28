import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useBetaStatus } from '@/hooks/beta/useBetaStatus';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { SimpleLoader } from '@/components/ui/SimpleLoader';

const BetaPending = () => {
  const navigate = useNavigate();
  const { logout } = useSupabaseAuth();
  const { betaInfo, loading, isPending, isActive, isRejected } = useBetaStatus();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  // Rediriger si l'utilisateur est actif
  React.useEffect(() => {
    if (!loading && isActive) {
      navigate('/');
    }
  }, [isActive, loading, navigate]);

  if (loading) {
    return <SimpleLoader />;
  }

  // Si pas de beta info, rediriger vers l'accueil
  if (!betaInfo) {
    navigate('/');
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          {isPending && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Demande en attente</CardTitle>
              <CardDescription>
                Votre demande d'accès beta est en cours de validation
              </CardDescription>
            </>
          )}
          
          {isRejected && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold">Demande refusée</CardTitle>
              <CardDescription>
                Votre demande d'accès beta n'a pas été approuvée
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {isPending && (
            <Alert>
              <AlertDescription className="text-sm">
                <div className="space-y-2">
                  <p className="font-medium">
                    🎉 Merci pour votre inscription !
                  </p>
                  <p>
                    Votre compte a été créé avec succès et est actuellement en attente de validation par notre équipe.
                  </p>
                  <p>
                    Vous recevrez une notification dès que votre accès sera activé.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isRejected && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">
                <div className="space-y-2">
                  <p className="font-medium">
                    Votre demande n'a pas été approuvée
                  </p>
                  {betaInfo.rejection_reason && (
                    <p className="text-xs opacity-90">
                      Raison : {betaInfo.rejection_reason}
                    </p>
                  )}
                  <p className="text-xs">
                    Si vous pensez qu'il s'agit d'une erreur, veuillez contacter notre support.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Email :</span>
              <span className="font-medium text-foreground">{betaInfo.email}</span>
            </div>
            <div className="flex justify-between">
              <span>Code d'invitation :</span>
              <span className="font-mono text-xs font-medium text-foreground">{betaInfo.invitation_code}</span>
            </div>
            <div className="flex justify-between">
              <span>Demande envoyée le :</span>
              <span className="font-medium text-foreground">
                {new Date(betaInfo.requested_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
          </Button>
          
          {isPending && (
            <p className="text-xs text-center text-muted-foreground">
              En attendant la validation, vous pouvez vous déconnecter et revenir plus tard
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default BetaPending;
