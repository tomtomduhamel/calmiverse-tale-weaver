
import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Clock } from 'lucide-react';

// Interface pour les utilisateurs Supabase
interface AccountInfoSectionProps {
  user: {
    email?: string; // Maintenant optionnel pour correspondre au type User de Supabase
    created_at?: string;
    last_sign_in_at?: string;
    app_metadata?: {
      provider?: string;
    };
  };
}

export const AccountInfoSection = ({ user }: AccountInfoSectionProps) => {
  // Extraire les données de l'utilisateur Supabase
  const email = user.email || '';
  const creationTime = user.created_at || new Date().toISOString();
  const lastSignInTime = user.last_sign_in_at || new Date().toISOString();

  // Récupérer le provider d'authentification
  const authProvider = user.app_metadata?.provider || 'email';

  return (
    <Card className="border border-border/70 bg-card/60 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-display italic">
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Informations du compte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-medium text-foreground">Email</label>
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 capitalize bg-primary/10 text-primary border-0">
              {authProvider}
            </Badge>
          </div>
          <Input value={email} readOnly className="bg-muted/50 text-xs sm:text-sm h-9" />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs sm:text-sm font-medium text-foreground">Date d'inscription</label>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input 
              value={format(new Date(creationTime), 'PPP', { locale: fr })} 
              readOnly 
              className="bg-muted/50 text-xs sm:text-sm h-9" 
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs sm:text-sm font-medium text-foreground">Dernière connexion</label>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input 
              value={format(new Date(lastSignInTime), 'PPP à p', { locale: fr })} 
              readOnly 
              className="bg-muted/50 text-xs sm:text-sm h-9" 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
