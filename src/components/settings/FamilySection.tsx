import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, KeyRound, Copy, Check } from 'lucide-react';
import { useFamily } from '@/hooks/settings/useFamily';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const FamilySection: React.FC = () => {
  const { families, members, inviteToken, isLoading, generateInvite, joinFamily } = useFamily();
  const { toast } = useToast();
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const token = await generateInvite();
      if (token) {
        // Copier automatiquement dans le presse-papier
        await navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        toast({
          title: "Code généré et copié !",
          description: `Le code "${token}" a été copié dans votre presse-papier. Partagez-le avec la personne à inviter.`,
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de générer le code. Veuillez réessayer.",
          variant: "destructive"
        });
      }
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le code.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteToken) {
      navigator.clipboard.writeText(inviteToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Code copié", description: "Le code a été copié dans le presse-papier." });
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    try {
      await joinFamily(joinCode.trim().toUpperCase());
      toast({
        title: "Tribu rejointe !",
        description: "Vous faites maintenant partie de cette famille et partagez ses personnages.",
      });
      setJoinCode('');
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e.message || "Code invalide ou expiré.",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return <Card className="animate-pulse"><CardContent className="h-40" /></Card>;
  }

  return (
    <Card className="border-2 overflow-hidden bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <CardTitle>Ma Tribu (Partage de personnages)</CardTitle>
        </div>
        <CardDescription>
          Créez ensemble ! Invitez un parent ou un membre de votre famille pour synchroniser et partager vos fiches d'enfants et histoires.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Liste des membres */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            Membres de la tribu ({members.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map(member => {
              const initials = member.displayName
                ? member.displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                : '?';
              return (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background/50">
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">{initials}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">
                      {member.displayName || 'Utilisateur inconnu'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email || ''} · {member.role === 'owner' ? '👑 Créateur' : 'Membre'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
          {/* Inviter qqn */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Inviter quelqu'un
            </h4>
            
            {!inviteToken ? (
              <Button onClick={handleGenerateCode} variant="outline" className="w-full" disabled={isGenerating}>
                {isGenerating ? 'Génération en cours...' : 'Générer un code d\'invitation'}
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Partagez ce code :</p>
                <div className="flex gap-2">
                  <Input value={inviteToken} readOnly className="font-mono text-center text-lg tracking-widest bg-primary/5" />
                  <Button variant="secondary" size="icon" onClick={copyToClipboard} title="Copier le code">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Button onClick={handleGenerateCode} variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" disabled={isGenerating}>
                  {isGenerating ? 'Génération...' : '↺ Générer un nouveau code'}
                </Button>
              </div>
            )}
          </div>

          {/* Rejoindre */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Rejoindre une tribu
            </h4>
            <div className="flex gap-2">
              <Input 
                placeholder="Ex: A1B2C3" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="font-mono uppercase"
                maxLength={6}
              />
              <Button onClick={handleJoin} disabled={isJoining || joinCode.length < 6}>
                Rejoindre
              </Button>
            </div>
            {families.length > 1 && (
              <Alert className="py-2 mt-2">
                <AlertDescription className="text-xs">
                  Vous appartenez à plusieurs tribus. Le personnage sera partagé avec la tribu créatrice.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
};
