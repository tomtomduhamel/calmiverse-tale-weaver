
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

// Adapter l'interface pour prendre en charge les utilisateurs Supabase
interface AccountInfoSectionProps {
  user: any;  // On utilise any pour supporter à la fois les utilisateurs Firebase et Supabase
}

export const AccountInfoSection = ({ user }: AccountInfoSectionProps) => {
  // Déterminer si on utilise un utilisateur Supabase ou Firebase
  const isSupabaseUser = !user.metadata?.creationTime;
  
  // Adapter les données en fonction du type d'utilisateur
  const email = user.email || '';
  const creationTime = isSupabaseUser 
    ? user.created_at || new Date().toISOString()
    : user.metadata?.creationTime || new Date().toISOString();
  const lastSignInTime = isSupabaseUser
    ? user.last_sign_in_at || new Date().toISOString()
    : user.metadata?.lastSignInTime || new Date().toISOString();

  // Déterminer le provider d'authentification
  const authProvider = isSupabaseUser
    ? user.app_metadata?.provider || 'email'
    : user.providerData && user.providerData[0]?.providerId === 'password' ? 'Email' : 'Google';

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
