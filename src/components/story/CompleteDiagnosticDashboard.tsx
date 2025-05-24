
import React from 'react';
import NetworkDiagnosticPanel from './NetworkDiagnosticPanel';
import EdgeFunctionStatusPanel from './EdgeFunctionStatusPanel';
import StoryCreationDiagnostic from './StoryCreationDiagnostic';
import ConnectionTestPanel from './ConnectionTestPanel';
import BypassTestPanel from './BypassTestPanel';
import ForcedRedeploymentPanel from './ForcedRedeploymentPanel';
import EnvironmentalDiagnosticPanel from './EnvironmentalDiagnosticPanel';
import PostgreSQLFallbackPanel from './PostgreSQLFallbackPanel';
import AdvancedRecoveryPanel from './AdvancedRecoveryPanel';

const CompleteDiagnosticDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Phase 1 - Diagnostics de base */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center mb-4">Phase 1 - Diagnostics de Base</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NetworkDiagnosticPanel />
          <EdgeFunctionStatusPanel />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StoryCreationDiagnostic />
          <ConnectionTestPanel />
        </div>
      </div>

      {/* Séparateur Phase 2 */}
      <div className="border-t-4 border-yellow-400 pt-6">
        <h2 className="text-2xl font-bold text-center mb-4 text-yellow-700 dark:text-yellow-300">
          Phase 2 - Tests de Contournement Avancés
        </h2>
        <div className="text-center text-gray-600 dark:text-gray-400 mb-6">
          <p>Tests spécialisés pour identifier et contourner le blocage POST vers les Edge Functions</p>
        </div>
      </div>

      {/* Phase 2 - Tests de contournement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BypassTestPanel />
        <ForcedRedeploymentPanel />
      </div>

      {/* Séparateur Phase 3 */}
      <div className="border-t-4 border-purple-400 pt-6">
        <h2 className="text-2xl font-bold text-center mb-4 text-purple-700 dark:text-purple-300">
          Phase 3 - Résolution Définitive
        </h2>
        <div className="text-center text-gray-600 dark:text-gray-400 mb-6">
          <p>Solutions environnementales, fallback PostgreSQL et récupération système complète</p>
        </div>
      </div>

      {/* Phase 3 - Résolution définitive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnvironmentalDiagnosticPanel />
        <PostgreSQLFallbackPanel />
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <AdvancedRecoveryPanel />
      </div>

      {/* Instructions Phase 3 */}
      <div className="p-4 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-300 dark:border-purple-700">
        <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-2">🔧 Instructions Phase 3 - Plan Complet</h3>
        <div className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
          <p><strong>1. Diagnostic Environnemental:</strong> Identifiez si le problème vient de votre réseau/firewall</p>
          <p><strong>2. Fallback PostgreSQL:</strong> Activez le système de contournement pour Edge Functions</p>
          <p><strong>3. Récupération Avancée:</strong> Nettoyez et optimisez le système complet</p>
          <p><strong>4. Si problème environnemental:</strong> Testez depuis un autre réseau/appareil</p>
          <p><strong>5. Si tout échoue:</strong> Utilisez le "Reset Application" pour réinitialiser complètement</p>
        </div>
      </div>

      {/* Résumé des actions disponibles */}
      <div className="p-4 bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg border border-green-300 dark:border-green-700">
        <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">✅ Actions Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700 dark:text-green-300">
          <div>
            <strong>Solutions Immédiates:</strong>
            <ul className="list-disc list-inside mt-1">
              <li>Diagnostic environnemental</li>
              <li>Test depuis autre réseau</li>
              <li>Fallback PostgreSQL</li>
            </ul>
          </div>
          <div>
            <strong>Solutions Techniques:</strong>
            <ul className="list-disc list-inside mt-1">
              <li>Récupération système</li>
              <li>Nettoyage base données</li>
              <li>Configuration monitoring</li>
            </ul>
          </div>
          <div>
            <strong>Solutions Drastiques:</strong>
            <ul className="list-disc list-inside mt-1">
              <li>Reset application</li>
              <li>Réinitialisation complète</li>
              <li>Nouveau déploiement</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteDiagnosticDashboard;
