
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Informations du compte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Email</label>
          <div className="flex items-center gap-2">
            <Input value={email} readOnly className="bg-muted" />
            <Badge>{authProvider}</Badge>
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Date d'inscription</label>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input 
              value={format(new Date(creationTime), 'PPP', { locale: fr })} 
              readOnly 
              className="bg-muted" 
            />
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Dernière connexion</label>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input 
              value={format(new Date(lastSignInTime), 'PPP à p', { locale: fr })} 
              readOnly 
              className="bg-muted" 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
