
import React from "react";

const N8nInfoPanels: React.FC = () => {
  return (
    <>
      {/* Informations sur les données envoyées */}
      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300">
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 Données envoyées à n8n :</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>userId, userEmail</li>
            <li>objective, childrenNames, childrenIds</li>
            <li>storyPrompt (prompt complet de génération)</li>
            <li>timestamp, requestId</li>
            <li>callbackUrl, expectedResponse</li>
          </ul>
        </div>
      </div>

      {/* URL du webhook de retour */}
      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded border border-green-300">
        <div className="text-sm text-green-800 dark:text-green-200">
          <strong>🔗 Webhook de retour pour n8n :</strong>
          <div className="mt-1 font-mono text-xs break-all">
            {`${window.location.origin}/supabase/functions/n8n-story-webhook`}
          </div>
          <p className="mt-1">
            Configurez n8n pour envoyer l'histoire complète à cette URL
          </p>
        </div>
      </div>

      {/* Instructions pour n8n */}
      <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-300">
        <div className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>⚙️ Configuration n8n requise :</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Utilisez le champ "storyPrompt" pour générer l'histoire</li>
            <li>Retournez les champs : title, content, summary, preview</li>
            <li>Conservez les métadonnées : objective, childrenNames, userId, childrenIds</li>
            <li>Définissez status: "completed" lors du retour</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default N8nInfoPanels;
