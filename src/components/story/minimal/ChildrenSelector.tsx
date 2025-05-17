
import React from "react";
import { AlertCircle } from "lucide-react";
import type { Child } from "@/types/child";

interface ChildrenSelectorProps {
  children: Child[];
  selectedChildrenIds: string[];
  onChildToggle: (childId: string) => void;
  error: string | null;
}

const ChildrenSelector: React.FC<ChildrenSelectorProps> = ({
  children,
  selectedChildrenIds,
  onChildToggle,
  error
}) => {
  if (children.length === 0) {
    return (
      <div className="p-4 text-center bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">
          Aucun profil enfant disponible. Vous devez créer un profil avant de générer une histoire.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Pour qui est cette histoire ?</h2>
      
      {error && error.includes("enfant") && (
        <div className="bg-destructive/10 border border-destructive p-3 rounded-lg text-destructive mb-3 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      <div className="space-y-2">
        {children.map((child) => {
          const isSelected = selectedChildrenIds.includes(child.id);
          const age = new Date().getFullYear() - new Date(child.birthDate).getFullYear();
          
          return (
            <div
              key={child.id}
              onClick={() => onChildToggle(child.id)}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all cursor-pointer ${
                isSelected
                  ? "bg-primary/10 hover:bg-primary/20" 
                  : "hover:bg-muted/50 dark:hover:bg-muted-dark/50"
              }`}
            >
              <div className="flex-shrink-0">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                  isSelected 
                    ? "bg-primary border-primary text-white" 
                    : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700"
                }`}>
                  {isSelected && (
                    <svg 
                      viewBox="0 0 24 24" 
                      width="16" 
                      height="16" 
                      stroke="currentColor" 
                      strokeWidth="3" 
                      fill="none" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              </div>
              
              <div className={`text-base font-medium leading-none transition-all ${
                isSelected ? "font-semibold text-primary" : ""
              }`}>
                {child.name} ({age} ans)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChildrenSelector;
