import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserCheck, 
  Key, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus,
  Loader2,
  Calendar,
  Mail,
  Tag,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BetaUser {
  id: string;
  user_id: string;
  email: string;
  invitation_code: string;
  status: string;
  requested_at: string;
  validated_at?: string;
  subscription_expires_at?: string;
  rejection_reason?: string;
}

interface BetaInvitation {
  id: string;
  code: string;
  tier: string;
  duration_months: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

interface BetaUserWithUsage extends BetaUser {
  stories_count?: number;
  audio_count?: number;
}

const BetaTesters = () => {
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<BetaUser[]>([]);
  const [activeUsers, setActiveUsers] = useState<BetaUserWithUsage[]>([]);
  const [invitations, setInvitations] = useState<BetaInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // État pour la création de code
  const [newCodeDialog, setNewCodeDialog] = useState(false);
  const [newCode, setNewCode] = useState({
    code: '',
    duration_months: 3,
    max_uses: null as number | null
  });

  // État pour le rejet
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; userId: string | null; reason: string }>({
    open: false,
    userId: null,
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les demandes en attente
      const { data: pending, error: pendingError } = await supabase
        .from('beta_users')
        .select('*')
        .eq('status', 'pending_validation')
        .order('requested_at', { ascending: false });

      if (pendingError) throw pendingError;
      setPendingUsers(pending || []);

      // Charger les beta testeurs actifs (sans jointure)
      const { data: active, error: activeError } = await supabase
        .from('beta_users')
        .select('*')
        .eq('status', 'active')
        .order('validated_at', { ascending: false });

      if (activeError) throw activeError;

      // Charger les stats d'abonnement pour chaque beta user
      const activeWithStats: BetaUserWithUsage[] = [];
      for (const user of (active || [])) {
        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('stories_used_this_period, audio_generations_used_this_period')
          .eq('user_id', user.user_id)
          .maybeSingle();
        
        activeWithStats.push({
          ...user,
          stories_count: subData?.stories_used_this_period || 0,
          audio_count: subData?.audio_generations_used_this_period || 0
        });
      }
      setActiveUsers(activeWithStats);

      // Charger les codes d'invitation
      const { data: invites, error: invitesError } = await supabase
        .from('beta_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;
      setInvitations(invites || []);

    } catch (err: any) {
      console.error('Error loading beta data:', err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données beta",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (betaUserId: string) => {
    try {
      setActionLoading(betaUserId);

      const { data, error } = await supabase.rpc('validate_beta_user', {
        p_beta_user_id: betaUserId
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Beta testeur validé",
          description: `Accès Calmix activé jusqu'au ${format(new Date(data.expires_at), 'dd MMMM yyyy', { locale: fr })}`
        });
        loadData();
      } else {
        throw new Error(data.error || 'Erreur lors de la validation');
      }
    } catch (err: any) {
      console.error('Error validating beta user:', err);
      toast({
        title: "Erreur",
        description: err.message || "Impossible de valider le beta testeur",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.userId) return;

    try {
      setActionLoading(rejectDialog.userId);

      const { data, error } = await supabase.rpc('reject_beta_user', {
        p_beta_user_id: rejectDialog.userId,
        p_reason: rejectDialog.reason || null
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Beta testeur rejeté",
          description: "L'utilisateur a été informé du refus"
        });
        setRejectDialog({ open: false, userId: null, reason: '' });
        loadData();
      } else {
        throw new Error(data.error || 'Erreur lors du rejet');
      }
    } catch (err: any) {
      console.error('Error rejecting beta user:', err);
      toast({
        title: "Erreur",
        description: err.message || "Impossible de rejeter le beta testeur",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateCode = async () => {
    try {
      if (!newCode.code.trim()) {
        toast({
          title: "Erreur",
          description: "Le code d'invitation est requis",
          variant: "destructive"
        });
        return;
      }

      setActionLoading('create-code');

      const { error } = await supabase
        .from('beta_invitations')
        .insert({
          code: newCode.code.toUpperCase().trim(),
          tier: 'calmix',
          duration_months: newCode.duration_months,
          max_uses: newCode.max_uses
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Ce code existe déjà');
        }
        throw error;
      }

      toast({
        title: "Code créé",
        description: `Le code ${newCode.code.toUpperCase()} a été créé avec succès`
      });

      setNewCodeDialog(false);
      setNewCode({ code: '', duration_months: 3, max_uses: null });
      loadData();
    } catch (err: any) {
      console.error('Error creating code:', err);
      toast({
        title: "Erreur",
        description: err.message || "Impossible de créer le code",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleCode = async (inviteId: string, currentStatus: boolean) => {
    try {
      setActionLoading(inviteId);

      const { error } = await supabase
        .from('beta_invitations')
        .update({ is_active: !currentStatus })
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Code désactivé" : "Code activé",
        description: `Le code a été ${currentStatus ? 'désactivé' : 'activé'} avec succès`
      });

      loadData();
    } catch (err: any) {
      console.error('Error toggling code:', err);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le code",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Gestion Beta Testeurs
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez les demandes d'accès beta et les codes d'invitation
            </p>
          </div>
          
          {pendingUsers.length > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              {pendingUsers.length} demande{pendingUsers.length > 1 ? 's' : ''} en attente
            </Badge>
          )}
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Demandes en attente ({pendingUsers.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Beta testeurs actifs ({activeUsers.length})
            </TabsTrigger>
            <TabsTrigger value="codes" className="gap-2">
              <Key className="h-4 w-4" />
              Codes d'invitation ({invitations.length})
            </TabsTrigger>
          </TabsList>

          {/* Onglet Demandes en attente */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Demandes en attente de validation</CardTitle>
                <CardDescription>
                  Validez ou rejetez les demandes d'accès beta
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingUsers.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Aucune demande en attente
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Code utilisé</TableHead>
                        <TableHead>Date demande</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {user.invitation_code}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(user.requested_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleValidate(user.id)}
                                disabled={actionLoading === user.id}
                              >
                                {actionLoading === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Valider
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setRejectDialog({ open: true, userId: user.id, reason: '' })}
                                disabled={actionLoading === user.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Refuser
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Beta testeurs actifs */}
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Beta testeurs actifs</CardTitle>
                <CardDescription>
                  Suivez l'utilisation de vos beta testeurs Calmix
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeUsers.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      Aucun beta testeur actif pour le moment
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Validé le</TableHead>
                        <TableHead>Expire le</TableHead>
                        <TableHead className="text-center">Histoires</TableHead>
                        <TableHead className="text-center">Audios</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.validated_at && (
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(user.validated_at), 'dd/MM/yyyy', { locale: fr })}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.subscription_expires_at && (
                              <Badge variant="secondary">
                                {format(new Date(user.subscription_expires_at), 'dd MMMM yyyy', { locale: fr })}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {user.stories_count || 0} / 50
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {user.audio_count || 0} / 2
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Codes d'invitation */}
          <TabsContent value="codes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Codes d'invitation</CardTitle>
                  <CardDescription>
                    Créez et gérez les codes d'invitation beta
                  </CardDescription>
                </div>
                <Dialog open={newCodeDialog} onOpenChange={setNewCodeDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau code
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer un code d'invitation</DialogTitle>
                      <DialogDescription>
                        Définissez les paramètres du nouveau code d'invitation
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="code">Code d'invitation</Label>
                        <Input
                          id="code"
                          placeholder="BETA2024"
                          value={newCode.code}
                          onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                          className="font-mono"
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration">Durée (mois)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          max="12"
                          value={newCode.duration_months}
                          onChange={(e) => setNewCode({ ...newCode, duration_months: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_uses">Nombre max d'utilisations (optionnel)</Label>
                        <Input
                          id="max_uses"
                          type="number"
                          min="1"
                          placeholder="Illimité"
                          value={newCode.max_uses || ''}
                          onChange={(e) => setNewCode({ 
                            ...newCode, 
                            max_uses: e.target.value ? parseInt(e.target.value) : null 
                          })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleCreateCode}
                        disabled={actionLoading === 'create-code'}
                      >
                        {actionLoading === 'create-code' ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Créer le code
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {invitations.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      Aucun code d'invitation créé. Créez-en un pour commencer !
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Durée</TableHead>
                        <TableHead className="text-center">Utilisations</TableHead>
                        <TableHead>Créé le</TableHead>
                        <TableHead className="text-center">Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono font-semibold">{invite.code}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {invite.duration_months} mois
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {invite.current_uses}
                              {invite.max_uses && ` / ${invite.max_uses}`}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(invite.created_at), 'dd/MM/yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={invite.is_active ? "default" : "secondary"}>
                              {invite.is_active ? "Actif" : "Inactif"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleCode(invite.id, invite.is_active)}
                              disabled={actionLoading === invite.id}
                            >
                              {actionLoading === invite.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : invite.is_active ? (
                                <>
                                  <ToggleRight className="h-4 w-4 mr-1" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-4 w-4 mr-1" />
                                  Activer
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de rejet */}
        <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ ...rejectDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refuser la demande beta</DialogTitle>
              <DialogDescription>
                Vous êtes sur le point de refuser cette demande d'accès beta.
                L'utilisateur sera informé du refus.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Raison du refus (optionnel)</Label>
                <Textarea
                  id="reason"
                  placeholder="Ex: Votre profil ne correspond pas aux critères de sélection actuels"
                  value={rejectDialog.reason}
                  onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRejectDialog({ open: false, userId: null, reason: '' })}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading === rejectDialog.userId}
              >
                {actionLoading === rejectDialog.userId ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Confirmer le refus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminGuard>
  );
};

export default BetaTesters;
