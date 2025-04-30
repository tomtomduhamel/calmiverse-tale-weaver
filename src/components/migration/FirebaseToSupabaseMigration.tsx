
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { migrateFirebaseUser, migrateUserData } from '@/utils/migration/firebase-to-supabase';
import { auth } from '@/lib/firebase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export const FirebaseToSupabaseMigration: React.FC = () => {
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [isMigrating, setIsMigrating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const { user: supabaseUser } = useSupabaseAuth();

  const handleMigration = async () => {
    if (!auth.currentUser) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté à Firebase pour migrer vos données",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsMigrating(true);
      setStatus('migrating');
      setMigrationProgress(10);

      // Si l'utilisateur est déjà connecté à Supabase, migrer directement les données
      if (supabaseUser) {
        setMigrationProgress(30);
        const result = await migrateUserData(auth.currentUser.uid);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        setMigrationProgress(100);
        setStatus('success');
        toast({
          title: "Migration réussie",
          description: "Vos données ont été migrées avec succès vers Supabase",
        });
      } else {
        // Sinon, migrer l'utilisateur et ses données
        setMigrationProgress(20);
        const result = await migrateFirebaseUser();
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        setMigrationProgress(100);
        setStatus('success');
        toast({
          title: "Migration réussie",
          description: "Votre compte et vos données ont été migrés avec succès vers Supabase",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la migration:", error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : "Erreur inconnue pendant la migration");
      toast({
        title: "Échec de la migration",
        description: "Une erreur est survenue lors de la migration de vos données",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (status === 'success') {
    return (
      <Alert className="bg-green-50 border-green-200">
        <AlertTitle className="text-green-800">Migration terminée</AlertTitle>
        <AlertDescription className="text-green-700">
          Toutes vos données ont été migrées avec succès vers Supabase. Vous pouvez maintenant utiliser l'application avec Supabase.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="rounded-lg border p-4 shadow-sm space-y-4">
      <h3 className="text-lg font-medium">Migration Firebase vers Supabase</h3>
      <p className="text-sm text-gray-600">
        Cette fonction va migrer vos données depuis Firebase vers Supabase. Assurez-vous d'être connecté à votre compte Firebase avant de commencer.
      </p>
      
      {status === 'migrating' && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Migration en cours...</p>
          <Progress value={migrationProgress} className="h-2" />
        </div>
      )}
      
      {status === 'error' && (
        <Alert variant="destructive">
          <AlertTitle>Erreur de migration</AlertTitle>
          <AlertDescription>
            {errorMessage || "Une erreur est survenue pendant la migration"}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-end">
        <Button
          onClick={handleMigration}
          disabled={isMigrating || !auth.currentUser}
        >
          {isMigrating ? "Migration en cours..." : "Migrer vers Supabase"}
        </Button>
      </div>
    </div>
  );
};

export default FirebaseToSupabaseMigration;
