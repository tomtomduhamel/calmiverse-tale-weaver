import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell } from 'lucide-react';
import { UserSettings } from '@/types/user-settings';

interface NotificationsSectionProps {
  notifications: UserSettings['notifications'];
  onNotificationChange: (key: keyof UserSettings['notifications'], value: boolean) => Promise<void>;
}

export const NotificationsSection = ({ notifications, onNotificationChange }: NotificationsSectionProps) => {
  return (
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
            checked={notifications.email}
            onCheckedChange={(checked) => onNotificationChange('email', checked)}
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
            checked={notifications.inApp}
            onCheckedChange={(checked) => onNotificationChange('inApp', checked)}
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
            checked={notifications.stories}
            onCheckedChange={(checked) => onNotificationChange('stories', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};