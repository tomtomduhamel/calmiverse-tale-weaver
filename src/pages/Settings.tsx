import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useKindleSettings } from '@/hooks/useKindleSettings';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  User,
  KeyRound,
  Bell,
  Trash2,
  Download,
  Settings as SettingsIcon,
  Mail,
  Globe,
  Clock,
} from 'lucide-react';
import { UserSettings, SecuritySettings } from '@/types/user-settings';

const securityFormSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
  newPassword: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const userFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
});

const Settings = () => {
  const { user } = useAuth();
  const { settings: kindleSettings } = useKindleSettings();
  const {
    userSettings,
    isLoading,
    updateUserSettings,
    updateUserPassword,
    exportUserData,
  } = useUserSettings();

  const securityForm = useForm<SecuritySettings>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const userForm = useForm<UserSettings>({
    resolver: zodResolver(userFormSchema),
    defaultValues: userSettings,
    values: userSettings,
  });

  const onSecuritySubmit = async (data: SecuritySettings) => {
    await updateUserPassword(data);
    securityForm.reset();
  };

  const onUserSubmit = async (data: Partial<UserSettings>) => {
    await updateUserSettings(data);
  };

  const handleNotificationChange = async (key: keyof UserSettings['notifications'], value: boolean) => {
    await updateUserSettings({
      notifications: {
        ...userSettings.notifications,
        [key]: value,
      },
    });
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <SettingsIcon className="h-8 w-8" />
        Paramètres utilisateur
      </h1>

      {/* Informations du compte */}
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
            <Input 
              value={user.metadata.creationTime ? format(new Date(user.metadata.creationTime), 'PPP', { locale: fr }) : 'N/A'} 
              readOnly 
              className="bg-muted" 
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Dernière connexion</label>
            <Input 
              value={user.metadata.lastSignInTime ? format(new Date(user.metadata.lastSignInTime), 'PPP à p', { locale: fr }) : 'N/A'} 
              readOnly 
              className="bg-muted" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Sécurité */}
      {user.providerData[0]?.providerId === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Sécurité
            </CardTitle>
            <CardDescription>
              Modifier votre mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...securityForm}>
              <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                <FormField
                  control={securityForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe actuel</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={securityForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nouveau mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={securityForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Mettre à jour le mot de passe
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
              <FormField
                control={userForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-2">
                <label className="text-sm font-medium">Fuseau horaire</label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </span>
                </div>
              </div>
              <Button type="submit">
                Enregistrer les modifications
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Notifications par email</label>
              <p className="text-sm text-muted-foreground">
                Recevoir des notifications par email
              </p>
            </div>
            <Switch
              checked={userSettings.notifications.email}
              onCheckedChange={(checked) => handleNotificationChange('email', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Notifications dans l'application</label>
              <p className="text-sm text-muted-foreground">
                Recevoir des notifications dans l'application
              </p>
            </div>
            <Switch
              checked={userSettings.notifications.inApp}
              onCheckedChange={(checked) => handleNotificationChange('inApp', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Notifications des histoires</label>
              <p className="text-sm text-muted-foreground">
                Être notifié des nouvelles histoires
              </p>
            </div>
            <Switch
              checked={userSettings.notifications.stories}
              onCheckedChange={(checked) => handleNotificationChange('stories', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Paramètres Kindle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Paramètres Kindle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Email Kindle</label>
            <Input value={kindleSettings.kindleEmail} readOnly className="bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* Gestion du compte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Gestion du compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={exportUserData}
            >
              <Download className="h-4 w-4" />
              Exporter mes données
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Supprimer mon compte
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground">
                    Supprimer mon compte
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;