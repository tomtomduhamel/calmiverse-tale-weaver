
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useKindleSettings } from '@/hooks/kindle/useKindleSettings';

import { useFeatureAccess } from '@/hooks/subscription/useFeatureAccess';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const KindleSection = () => {
  const [email, setEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { settings, updateSettings, isLoading } = useKindleSettings();
  const { featureAccess, loading: featureLoading } = useFeatureAccess();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Mettre à jour l'email local lorsque les settings changent
  useEffect(() => {
    if (settings.kindleEmail) {
      setEmail(settings.kindleEmail);
    }
  }, [settings.kindleEmail]);
  
  const isValidEmail = email.trim() !== '' && email.endsWith('@kindle.com');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      console.log('Tentative de sauvegarde de l\'email Kindle:', email);
      const result = await updateSettings({
        firstName: settings.firstName || '',
        lastName: settings.lastName || '',
        kindleEmail: email.trim()
      });
      
      if (result.success) {
        toast({
          title: "Adresse email mise à jour",
          description: "Votre adresse Kindle a été enregistrée avec succès.",
        });
        console.log('Email Kindle sauvegardé avec succès');
      } else {
        const errorMessage = result.errors?.[0]?.message || "Une erreur est survenue";
        console.error('Erreur lors de la sauvegarde:', errorMessage);
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'email Kindle:', error);
      const errorMessage = error instanceof Error ? error.message : "Impossible de mettre à jour l'adresse email";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || featureLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Paramètres Kindle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasKindleAccess = featureAccess.kindle_export;

  if (!hasKindleAccess) {
    return (
      <Card className="border-primary/20 bg-muted/40">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Paramètres Kindle
            </div>
            <Button size="sm" variant="default" onClick={() => navigate('/pricing')} className="gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5" /> Débloquer dès Calmidium
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            L'envoi automatique d'histoires au format EPUB vers votre liseuse <strong>Kindle</strong> est accessible à partir du forfait <strong>Calmidium (5$/mois)</strong>.
          </p>
          <p className="text-xs">
            Idéal pour lire les contes le soir sans écran émettant de la lumière bleue.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Paramètres Kindle
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Email Kindle</label>
            <div className="flex gap-2">
              <Input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votreadresse@kindle.com" 
                className="flex-1"
                disabled={isUpdating}
              />
              <Button 
                type="submit" 
                size="sm" 
                disabled={isUpdating || !isValidEmail}
              >
                {isUpdating ? (
                  <span className="animate-spin mr-2">⟳</span>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isUpdating ? "Sauvegarde..." : "Enregistrer"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              L'adresse email doit se terminer par @kindle.com
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
