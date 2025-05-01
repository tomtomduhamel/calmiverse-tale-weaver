
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useKindleSettings } from '@/hooks/useKindleSettings';

interface KindleSectionProps {
  kindleEmail: string;
}

export const KindleSection = ({ kindleEmail }: KindleSectionProps) => {
  const [email, setEmail] = useState(kindleEmail);
  const [isUpdating, setIsUpdating] = useState(false);
  const { settings, updateSettings } = useKindleSettings();
  const { toast } = useToast();
  
  // Mettre à jour l'email local lorsque kindleEmail change
  useEffect(() => {
    if (kindleEmail) {
      setEmail(kindleEmail);
    }
  }, [kindleEmail]);
  
  const isValidEmail = email.trim() !== '' && email.endsWith('@kindle.com');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      console.log('Sauvegarde des paramètres Kindle avec email:', email);
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
      } else {
        throw new Error(result.errors?.[0]?.message || "Une erreur est survenue");
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'email Kindle:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour l'adresse email",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
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
                Enregistrer
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
