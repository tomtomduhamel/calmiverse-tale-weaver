
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from '@/components/auth/LoginForm';
import { SimpleLoader } from '@/components/ui/SimpleLoader';

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useSupabaseAuth();

  // Rediriger vers la page d'accueil si l'utilisateur est déjà connecté
  React.useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <SimpleLoader />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Bienvenue sur Calmi</CardTitle>
          <CardDescription>
            Connectez-vous pour créer des histoires personnalisées pour vos enfants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <LoginForm isRegister={false} />
            </TabsContent>
            <TabsContent value="register" className="mt-4">
              <LoginForm isRegister={true} />
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
