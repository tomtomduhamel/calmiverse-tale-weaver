
import React from "react";
import { AlertCircle, Sparkles } from "lucide-react";

interface StatusMessagesProps {
  error: string | null;
  successMessage: string | null;
}

const StatusMessages: React.FC<StatusMessagesProps> = ({ error, successMessage }) => {
  if (!error && !successMessage) return null;
  
  return (
    <>
      {/* Message d'erreur */}
      {error && !error.includes("enfant") && !error.includes("objectif") && (
        <div className="bg-destructive/10 border border-destructive p-4 rounded-lg text-destructive mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Message de succès */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg text-green-700 dark:text-green-300 mb-6">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default StatusMessages;
