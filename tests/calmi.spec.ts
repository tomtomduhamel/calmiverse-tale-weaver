import { test, expect } from '@playwright/test';

test.describe('Calmi - Résilience et Démarrage', () => {

  // Test 1 : Chargement standard sans écran blanc
  test('devrait charger la page d\'accueil sans écran blanc', async ({ page }) => {
    await page.goto('/');

    // Attendre que l'application soit montée (on cible l'élément principal #root ou le conteneur principal)
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty({ timeout: 10000 });

    // Vérifier la présence de mots-clés typiques de la Landing Page de Calmi
    // Par exemple "Calmi" ou "Histoires" ou "enfants"
    await expect(page.locator('body')).toContainText('Calmi');
  });

  // Test 2 : Mode Démo de Secours (?demo=1)
  test('devrait activer le mode démo de secours avec le paramètre ?demo=1', async ({ page }) => {
    await page.goto('/?demo=1');

    // On s'assure que le corps de la page n'est pas vide
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 10000 });

    // Vérifier la présence de la bannière ou du texte de mode démo
    // Dans le TESTING_GUIDE.md, il est mentionné "Mode Démonstration" ou "Données d'exemple uniquement"
    const demoIndicator = page.locator('body');
    await expect(demoIndicator).toContainText(/Démo/i);
  });

  // Test 3 : LocalStorage et SessionStorage Bloqués (Fallback mémoire)
  test('devrait fonctionner correctement même si localStorage et sessionStorage sont bloqués', async ({ page, context }) => {
    // Injecter un script pour lever une erreur de sécurité lors de l'accès au stockage local/session
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get: () => { throw new Error('SecurityError: LocalStorage bloqué par l\'utilisateur'); }
      });
      Object.defineProperty(window, 'sessionStorage', {
        get: () => { throw new Error('SecurityError: SessionStorage bloqué par l\'utilisateur'); }
      });
    });

    await page.goto('/');

    // Attendre le montage de l'application
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 10000 });

    // Vérifier que la page se charge correctement et ne reste pas bloquée sur un écran blanc
    await expect(page.locator('body')).toContainText('Calmi');
  });
});
