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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  // État pour la validation VIP
  const [validationDialog, setValidationDialog] = useState<{
    open: boolean;
    user: BetaUser | null;
    tier: string;
    durationMonths: number;
  }>({
    open: false,
    user: null,
    tier: 'calmix',
    durationMonths: 3
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

  const handleConfirmValidation = async () => {
    if (!validationDialog.user) return;
    
    try {
      setActionLoading(validationDialog.user.id);
      
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + validationDialog.durationMonths);
      
      const authUser = await supabase.auth.getUser();
      
      // Update beta_users
      const { error: betaError } = await supabase
        .from('beta_users')
        .update({
          status: 'active',
          validated_at: new Date().toISOString(),
          validated_by: authUser.data.user?.id,
          subscription_expires_at: expiresAt.toISOString()
        })
        .eq('id', validationDialog.user.id);
        
      if (betaError) throw betaError;
      
      // Update/Insert user_subscriptions
      const { error: subError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: validationDialog.user.user_id,
          tier: validationDialog.tier,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: expiresAt.toISOString(),
          stories_used_this_period: 0,
          audio_generations_used_this_period: 0
        }, { onConflict: 'user_id' });
        
      if (subError) throw subError;
      
      toast({
        title: "Beta testeur validé",
        description: `Accès activé jusqu'au ${format(expiresAt, 'dd MMMM yyyy', { locale: fr })}`
      });
      
      setValidationDialog({ open: false, user: null, tier: 'calmix', durationMonths: 3 });
      loadData();
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Demandes en attente ({pendingUsers.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Beta testeurs actifs ({activeUsers.length})
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
                        <TableHead>Origine (Code)</TableHead>
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
                                onClick={() => setValidationDialog({ open: true, user, tier: 'calmix', durationMonths: 3 })}
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
        {/* Dialog de validation VIP */}
        <Dialog open={validationDialog.open} onOpenChange={(open) => setValidationDialog({ ...validationDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Valider l'accès Early Adopter</DialogTitle>
              <DialogDescription>
                Choisissez le niveau d'abonnement que vous souhaitez offrir à cet utilisateur.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Niveau d'abonnement</Label>
                <Select 
                  value={validationDialog.tier} 
                  onValueChange={(val) => setValidationDialog({ ...validationDialog, tier: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un forfait" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calmini">Calmini</SelectItem>
                    <SelectItem value="calmix">Calmix</SelectItem>
                    <SelectItem value="calmiverse">Calmiverse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Durée de validité (en mois)</Label>
                <Select 
                  value={validationDialog.durationMonths.toString()} 
                  onValueChange={(val) => setValidationDialog({ ...validationDialog, durationMonths: parseInt(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une durée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mois</SelectItem>
                    <SelectItem value="3">3 mois</SelectItem>
                    <SelectItem value="6">6 mois</SelectItem>
                    <SelectItem value="12">1 an</SelectItem>
                    <SelectItem value="120">À vie (10 ans)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setValidationDialog({ open: false, user: null, tier: 'calmix', durationMonths: 3 })}
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmValidation}
                disabled={actionLoading === validationDialog.user?.id}
                className="bg-primary hover:bg-primary/90"
              >
                {actionLoading === validationDialog.user?.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirmer l'accès
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminGuard>
  );
};

export default BetaTesters;
