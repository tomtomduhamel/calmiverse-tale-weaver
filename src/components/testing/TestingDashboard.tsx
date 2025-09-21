import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkflowTestingPanel } from './WorkflowTestingPanel';
import { MigrationControlPanel } from './MigrationControlPanel';
import { TestTube, Users, Settings } from 'lucide-react';

/**
 * Dashboard centralisé pour tous les tests et contrôles Phase 6
 * Uniquement visible en mode développement
 */
export const TestingDashboard: React.FC = () => {
  // Ne rendre que si en mode développement
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Calmiverse - Testing Dashboard</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Phase 6 - Tests et validation du nouveau système de notifications
          </p>
          <div className="text-sm text-muted-foreground mt-1">
            Mode développement uniquement
          </div>
        </div>

        <Tabs defaultValue="workflow" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="workflow" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Tests Workflow
            </TabsTrigger>
            <TabsTrigger value="migration" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Migration
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflow" className="mt-6">
            <WorkflowTestingPanel />
          </TabsContent>

          <TabsContent value="migration" className="mt-6">
            <MigrationControlPanel />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Système</CardTitle>
                <CardDescription>
                  Paramètres globaux et variables d'environnement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Variables d'Environnement</h4>
                    <div className="bg-muted p-3 rounded text-sm font-mono">
                      <div>NODE_ENV: {process.env.NODE_ENV}</div>
                      <div>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Configuré' : '❌ Manquant'}</div>
                      <div>PWA Support: {'serviceWorker' in navigator ? '✅ Supporté' : '❌ Non supporté'}</div>
                      <div>Notifications: {'Notification' in window ? '✅ Supportées' : '❌ Non supportées'}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Services Actifs</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>✅ FeatureFlagService</div>
                      <div>✅ NotificationTester</div>
                      <div>✅ MigrationService</div>
                      <div>✅ StoryGenerationQueue</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Stockage Local</h4>
                    <div className="text-sm space-y-1">
                      <div>calmiverse_feature_flags: {localStorage.getItem('calmiverse_feature_flags') ? '✅' : '❌'}</div>
                      <div>calmiverse_story_queue: {localStorage.getItem('calmiverse_story_queue') ? '✅' : '❌'}</div>
                      <div>calmiverse_migration_service: {localStorage.getItem('calmiverse_migration_service') ? '✅' : '❌'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};