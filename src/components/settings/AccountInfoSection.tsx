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
import { User as FirebaseUser } from 'firebase/auth';

interface AccountInfoSectionProps {
  user: FirebaseUser;
}

export const AccountInfoSection = ({ user }: AccountInfoSectionProps) => {
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
            <Input value={user.email || ''} readOnly className="bg-muted" />
            <Badge>{user.providerData[0]?.providerId === 'password' ? 'Email' : 'Google'}</Badge>
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Date d'inscription</label>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input 
              value={user.metadata.creationTime ? format(new Date(user.metadata.creationTime), 'PPP', { locale: fr }) : 'N/A'} 
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
              value={user.metadata.lastSignInTime ? format(new Date(user.metadata.lastSignInTime), 'PPP à p', { locale: fr }) : 'N/A'} 
              readOnly 
              className="bg-muted" 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};