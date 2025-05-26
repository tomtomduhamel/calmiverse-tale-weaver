
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
          </ul>
        </div>
      </div>

      {/* Instructions pour n8n */}
      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded border border-green-300">
        <div className="text-sm text-green-800 dark:text-green-200">
          <strong>⚙️ Configuration n8n requise :</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Utilisez le champ "storyPrompt" pour générer l'histoire</li>
            <li>Utilisez un noeud Supabase pour insérer directement en base</li>
            <li>Insérez dans la table "stories" avec les champs requis</li>
            <li>Champs obligatoires : title, content, summary, preview, objective, childrenNames, userId, childrenIds</li>
          </ul>
        </div>
      </div>

      {/* Configuration Supabase pour n8n */}
      <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-300">
        <div className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>🔧 Configuration Supabase dans n8n :</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>URL Supabase : https://ioeihnoxvtpxtqhxklpw.supabase.co</li>
            <li>Utilisez votre clé API Supabase dans le noeud</li>
            <li>Table : stories</li>
            <li>Opération : Insert</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default N8nInfoPanels;
