
import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import type { Child } from "@/types/child";

interface N8nChildrenSelectorProps {
  children: Child[];
  selectedChildrenIds: string[];
  onChildSelect: (childId: string) => void;
  hasChildren: boolean;
}

const N8nChildrenSelector: React.FC<N8nChildrenSelectorProps> = ({
  children,
  selectedChildrenIds,
  onChildSelect,
  hasChildren
}) => {
  return (
    <div className="space-y-2">
      <Label>Enfants sélectionnés</Label>
      {hasChildren ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {children.map((child) => (
            <div
              key={child.id}
              onClick={() => onChildSelect(child.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedChildrenIds.includes(child.id)
                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="font-medium">{child.name}</span>
              {selectedChildrenIds.includes(child.id) && (
                <span className="ml-2 text-xs text-blue-600">✓</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Aucun profil d'enfant disponible. 
              {children ? ` (Reçu: ${children.length} enfants)` : ' (Aucune donnée reçue)'}
              Créez d'abord un profil pour pouvoir générer une histoire.
            </span>
            <Link to="/children">
              <Button variant="outline" size="sm" className="ml-2">
                <UserPlus className="h-4 w-4 mr-1" />
                Créer un profil
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default N8nChildrenSelector;
