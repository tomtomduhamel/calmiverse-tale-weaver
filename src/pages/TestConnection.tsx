
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const TestConnection = () => {
  const [dbStatus, setDbStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [authStatus, setAuthStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [edgeFnStatus, setEdgeFnStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Tester la connexion à la base de données
  const testDatabase = async () => {
    try {
      setDbStatus('loading');
      const { data, error } = await supabase.from('stories').select('count').limit(1);
      
      if (error) throw error;
      
      console.log('Connexion à la base de données réussie:', data);
      setDbStatus('success');
    } catch (err: any) {
      console.error('Erreur de connexion à la base de données:', err);
      setDbStatus('error');
      setError(err.message);
    }
  };

  // Tester l'authentification
  const testAuth = async () => {
    try {
      setAuthStatus('loading');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      setUser(data.session?.user || null);
      console.log('Authentification vérifiée:', data);
      setAuthStatus('success');
    } catch (err: any) {
      console.error('Erreur de vérification d\'authentification:', err);
      setAuthStatus('error');
      setError(err.message);
    }
  };

  // Tester les Edge Functions
  const testEdgeFunctions = async () => {
    try {
      setEdgeFnStatus('loading');
      
      // Ping simple pour vérifier que les fonctions sont accessibles
      const { data, error } = await supabase.functions.invoke('generate-story', {
        body: { ping: true }
      });
      
      if (error) throw error;
      
      console.log('Edge Functions accessibles:', data);
      setEdgeFnStatus('success');
    } catch (err: any) {
      console.error('Erreur d\'accès aux Edge Functions:', err);
      setEdgeFnStatus('error');
      setError(err.message);
    }
  };

  useEffect(() => {
    testDatabase();
    testAuth();
    testEdgeFunctions();
  }, []);

  const getStatusIcon = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-yellow-500 animate-pulse" />;
    }
  };

  return (
    <div className="container mx-auto p-4 mt-8">
      <h1 className="text-3xl font-bold mb-6">Test de connexion Supabase</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(dbStatus)} Base de données
            </CardTitle>
            <CardDescription>Test de connexion à la base de données Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            {dbStatus === 'loading' && <p>Vérification en cours...</p>}
            {dbStatus === 'success' && <p>Connexion réussie à la base de données</p>}
            {dbStatus === 'error' && <p className="text-red-500">Échec de connexion</p>}
          </CardContent>
          <CardFooter>
            <Button onClick={testDatabase} variant="outline">Tester à nouveau</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(authStatus)} Authentification
            </CardTitle>
            <CardDescription>Test du système d'authentification</CardDescription>
          </CardHeader>
          <CardContent>
            {authStatus === 'loading' && <p>Vérification en cours...</p>}
            {authStatus === 'success' && (
              <div>
                <p>Authentification fonctionnelle</p>
                {user ? (
                  <p className="text-sm mt-2">Connecté en tant que: {user.email}</p>
                ) : (
                  <p className="text-sm mt-2">Aucun utilisateur connecté</p>
                )}
              </div>
            )}
            {authStatus === 'error' && <p className="text-red-500">Problème d'authentification</p>}
          </CardContent>
          <CardFooter>
            <Button onClick={testAuth} variant="outline">Tester à nouveau</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(edgeFnStatus)} Edge Functions
            </CardTitle>
            <CardDescription>Test des fonctions Edge Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            {edgeFnStatus === 'loading' && <p>Vérification en cours...</p>}
            {edgeFnStatus === 'success' && <p>Edge Functions accessibles</p>}
            {edgeFnStatus === 'error' && <p className="text-red-500">Problème d'accès aux Edge Functions</p>}
          </CardContent>
          <CardFooter>
            <Button onClick={testEdgeFunctions} variant="outline">Tester à nouveau</Button>
          </CardFooter>
        </Card>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Erreur détectée</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Étapes suivantes</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Vérifier la configuration des fonctions Edge dans le projet Supabase</li>
          <li>S'assurer que toutes les tables ont des politiques RLS appropriées</li>
          <li>Confirmer que les webhooks pour l'email et Kindle sont configurés correctement</li>
          <li>Tester les flux d'authentification (inscription, connexion, déconnexion)</li>
        </ul>
      </div>
    </div>
  );
};

export default TestConnection;
