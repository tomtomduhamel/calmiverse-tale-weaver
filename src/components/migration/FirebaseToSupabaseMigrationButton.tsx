
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { migrateFirebaseUser } from '@/utils/firebase-to-supabase';

export const FirebaseToSupabaseMigrationButton: React.FC = () => {
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [isMigrating, setIsMigrating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleMigration = async () => {
    try {
      setIsMigrating(true);
      setStatus('migrating');
      setMigrationProgress(10);

      setTimeout(() => setMigrationProgress(30), 500);
      
      const result = await migrateFirebaseUser();
      
      setTimeout(() => setMigrationProgress(80), 500);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setMigrationProgress(100);
      setStatus('success');
      
      toast({
        title: "Migration réussie",
        description: result.message || "Votre compte et vos données ont été migrés avec succès vers Supabase",
      });
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
    <div className="space-y-4">
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
      
      <Button
        onClick={handleMigration}
        disabled={isMigrating}
        className="w-full"
      >
        {isMigrating ? "Migration en cours..." : "Migrer vers Supabase"}
      </Button>
    </div>
  );
};

export default FirebaseToSupabaseMigrationButton;
