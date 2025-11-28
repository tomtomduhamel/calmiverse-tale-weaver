import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, FileText, Volume2, MessageSquare, Users } from 'lucide-react';
import { useIsAdmin } from '@/hooks/auth/useIsAdmin';

export const AdminLinksSection = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useIsAdmin();

  if (loading || !isAdmin) {
    return null;
  }

  const adminLinks = [
    {
      title: 'Gestion Beta Testeurs',
      description: 'Valider les demandes et gérer les codes d\'invitation',
      icon: Users,
      path: '/admin/beta-testers',
      color: 'text-blue-500'
    },
    {
      title: 'Gestion Prompts',
      description: 'Modifier les templates de prompts IA',
      icon: FileText,
      path: '/admin/prompts',
      color: 'text-green-500'
    },
    {
      title: 'Configuration TTS',
      description: 'Paramètres de génération audio',
      icon: Volume2,
      path: '/admin/tts-config',
      color: 'text-purple-500'
    },
    {
      title: 'Feedback Utilisateurs',
      description: 'Consulter les retours utilisateurs',
      icon: MessageSquare,
      path: '/admin/feedback',
      color: 'text-orange-500'
    }
  ];

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Administration</CardTitle>
        </div>
        <CardDescription>
          Accès aux outils d'administration réservés aux super-admins
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Button
                key={link.path}
                variant="outline"
                className="h-auto justify-start text-left"
                onClick={() => navigate(link.path)}
              >
                <div className="flex items-start gap-3 w-full">
                  <Icon className={`h-5 w-5 mt-0.5 ${link.color}`} />
                  <div className="flex-1">
                    <div className="font-semibold">{link.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {link.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
