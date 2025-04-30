
import React from "react";

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="p-4 bg-red-50 rounded-md">
      <h3 className="text-lg font-medium text-red-800">Erreur de chargement:</h3>
      <p>{message}</p>
      <button 
        onClick={onRetry} 
        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Réessayer
      </button>
    </div>
  );
};
