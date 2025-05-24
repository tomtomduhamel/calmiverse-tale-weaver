
import React from 'react';
import NetworkDiagnosticPanel from './NetworkDiagnosticPanel';
import EdgeFunctionStatusPanel from './EdgeFunctionStatusPanel';
import StoryCreationDiagnostic from './StoryCreationDiagnostic';
import ConnectionTestPanel from './ConnectionTestPanel';
import BypassTestPanel from './BypassTestPanel';
import ForcedRedeploymentPanel from './ForcedRedeploymentPanel';

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

      {/* Instructions Phase 2 */}
      <div className="p-4 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-300 dark:border-yellow-700">
        <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">📋 Instructions Phase 2</h3>
        <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <p><strong>1.</strong> Lancez d'abord les <strong>Tests de Contournement</strong> pour identifier le point exact de blocage</p>
          <p><strong>2.</strong> Ensuite, utilisez le <strong>Redéploiement Forcé</strong> pour tenter de résoudre le problème</p>
          <p><strong>3.</strong> Comparez les résultats entre les différents tests pour analyser la situation</p>
          <p><strong>4.</strong> Reportez les résultats pour passer à la Phase 3 si nécessaire</p>
        </div>
      </div>
    </div>
  );
};

export default CompleteDiagnosticDashboard;
