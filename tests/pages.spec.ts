import { test, expect } from '@playwright/test';

// Configuration de simulation pour l'authentification et l'API Supabase
async function mockAuthenticatedState(page: any) {
  // Injecter un token de session simulé dans le localStorage
  await page.addInitScript(() => {
    // Supabase v2 stocke l'objet de session directement sous la clé spécifiée (sans wrapper currentSession)
    const mockSession = {
      access_token: 'mock-jwt-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-1234',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
        phone: '',
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: { full_name: 'Test User' },
        identities: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };
    // Calmi utilise explicitement la clé 'calmi-auth-token' définie dans integrations/supabase/client.ts
    window.localStorage.setItem('calmi-auth-token', JSON.stringify(mockSession));
  });

  // Intercepter les requêtes d'authentification Supabase (pour renvoyer le profil et la session simulés)
  await page.route('**/auth/v1/**', async (route: any) => {
    const url = route.request().url();
    let body = {};
    
    if (url.includes('/user')) {
      body = {
        id: 'mock-user-1234',
        email: 'test@example.com',
        app_metadata: { provider: 'email' },
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated'
      };
    } else if (url.includes('/token')) {
      body = {
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'mock-user-1234',
          email: 'test@example.com',
          app_metadata: { provider: 'email' },
          user_metadata: {},
          aud: 'authenticated',
          role: 'authenticated'
        }
      };
    } else {
      // Pour les autres requêtes auth, renvoyer un objet générique réussi
      body = {
        id: 'mock-user-1234',
        email: 'test@example.com'
      };
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body)
    });
  });

  // Intercepter les requêtes de données Supabase (REST API et RPC)
  await page.route('**/rest/v1/**', async (route: any) => {
    const url = route.request().url();
    const method = route.request().method();
    let responseBody: any = [];

    // Gérer les appels de fonctions PostgreSQL (RPC) qui utilisent le protocole POST
    if (url.includes('/rpc/')) {
      if (url.includes('get_stories_count_by_children')) {
        responseBody = [
          { child_id: 'child-1', story_count: 5 },
          { child_id: 'child-2', story_count: 2 }
        ];
      } else {
        responseBody = [];
      }
    } else if (method === 'GET') {
      if (url.includes('/users?')) {
        // Paramètres utilisateur correspondants aux types attendus par Settings.tsx
        responseBody = [{
          id: 'mock-user-1234',
          firstname: 'Test',
          lastname: 'User',
          email: 'test@example.com',
          language: 'fr',
          email_notifications: true,
          inapp_notifications: true,
          story_notifications: true,
          system_notifications: true,
          auto_scroll_enabled: false,
          reading_speed: 120,
          background_music_enabled: true,
          video_intro_enabled: true,
          timezone: 'Europe/Paris',
          onboarding_completed: true // Évite la redirection vers /app/welcome
        }];
      } else if (url.includes('/children?')) {
        responseBody = [
          { id: 'child-1', name: 'Alice', avatar_url: '', birthdate: '2020-01-01', interests: ['Dessin'], gender: 'female' },
          { id: 'child-2', name: 'Bob', avatar_url: '', birthdate: '2018-05-12', interests: ['Espace'], gender: 'male' }
        ];
      } else if (url.includes('/stories?')) {
        responseBody = [];
      } else if (url.includes('/routines?')) {
        responseBody = [];
      } else if (url.includes('/voices?')) {
        responseBody = [];
      }
    } else {
      // POST, PUT, PATCH, DELETE renvoient un succès standard
      responseBody = {};
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseBody)
    });
  });
}

test.describe('Vérification du chargement et du bon fonctionnement de toutes les pages', () => {

  // --- PAGES PUBLIQUES ---

  test('Page d\'accueil (Landing) devrait se charger sans erreur', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty({ timeout: 10000 });
    await expect(page.locator('body')).toContainText(/Calmi/i);
    await expect(page).toHaveURL('/');
  });

  test('Page d\'authentification (Auth) devrait se charger sans erreur', async ({ page }) => {
    await page.goto('/auth');
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty({ timeout: 10000 });
    // Devrait contenir des champs de connexion typiques
    await expect(page.locator('body')).toContainText(/Connexion/i);
    await expect(page).toHaveURL('/auth');
  });

  test('Page de tarification (Pricing) devrait se charger sans erreur', async ({ page }) => {
    await page.goto('/pricing');
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty({ timeout: 10000 });
    await expect(page.locator('body')).toContainText(/plan/i);
    await expect(page).toHaveURL('/pricing');
  });

  test('Page Politique de Confidentialité (Privacy) devrait se charger sans erreur', async ({ page }) => {
    await page.goto('/privacy');
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty({ timeout: 10000 });
    await expect(page.locator('body')).toContainText(/Confidentialité/i);
    await expect(page).toHaveURL('/privacy');
  });

  test('Page Conditions d\'Utilisation (Terms) devrait se charger sans erreur', async ({ page }) => {
    await page.goto('/terms');
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty({ timeout: 10000 });
    await expect(page.locator('body')).toContainText(/Conditions/i);
    await expect(page).toHaveURL('/terms');
  });

  // --- PAGES PROTÉGÉES (SIMULÉES) ---

  test('Page Dashboard (/app/dashboard) devrait se charger sans écran blanc', async ({ page }) => {
    await mockAuthenticatedState(page);
    await page.goto('/app/dashboard');
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty({ timeout: 10000 });
    // Devrait afficher la barre latérale ou des éléments de dashboard (titre "Mon ciel")
    await expect(page.locator('body')).toContainText(/Mon ciel/i);
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });

  test('Page des Paramètres (/app/settings) devrait se charger et afficher le Badge Premium', async ({ page }) => {
    await mockAuthenticatedState(page);
    await page.goto('/app/settings');
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty({ timeout: 15000 });
    // Vérification que le badge "Premium" du studio vocal familial est visible
    await expect(page.locator('body')).toContainText(/Paramètres/i);
    await expect(page.locator('body')).toContainText(/Premium/i);
    await expect(page).toHaveURL(/\/app\/settings/);
  });

  test('Page Enfants (/app/children) devrait se charger sans erreur', async ({ page }) => {
    await mockAuthenticatedState(page);
    await page.goto('/app/children');
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty({ timeout: 10000 });
    await expect(page.locator('body')).toContainText(/Enfants/i);
    await expect(page).toHaveURL(/\/app\/children/);
  });

  test('Page Bibliothèque (/app/library) devrait se charger sans erreur', async ({ page }) => {
    await mockAuthenticatedState(page);
    await page.goto('/app/library');
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty({ timeout: 10000 });
    await expect(page.locator('body')).toContainText(/Bibliothèque/i);
    await expect(page).toHaveURL(/\/app\/library/);
  });

  test('Page Studio Vocal (/app/voices) devrait se charger sans erreur', async ({ page }) => {
    await mockAuthenticatedState(page);
    await page.goto('/app/voices');
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty({ timeout: 10000 });
    await expect(page.locator('body')).toContainText(/Vocal/i);
    await expect(page).toHaveURL(/\/app\/voices/);
  });

  test('Page Routines (/app/routines) devrait se charger sans erreur', async ({ page }) => {
    await mockAuthenticatedState(page);
    await page.goto('/app/routines');
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty({ timeout: 10000 });
    await expect(page.locator('body')).toContainText(/Routine/i);
    await expect(page).toHaveURL(/\/app\/routines/);
  });
});
