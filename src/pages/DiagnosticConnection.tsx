
import React from 'react';
import CompleteDiagnosticDashboard from '@/components/story/CompleteDiagnosticDashboard';

const DiagnosticConnection = () => {
  return (
    <div className="container mx-auto p-4 mt-8">
      <h1 className="text-3xl font-bold mb-6 text-center">
        🔍 Diagnostic Complet - Phase 1
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
        Diagnostic approfondi pour identifier le blocage de génération d'histoires
      </p>
      
      <CompleteDiagnosticDashboard />
    </div>
  );
};

export default DiagnosticConnection;
