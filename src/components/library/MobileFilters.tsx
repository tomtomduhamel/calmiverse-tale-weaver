import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  X, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  BookOpen
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MobileFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'pending' | 'ready' | 'read' | 'unread' | 'error' | 'favorites' | 'recent';
  onStatusChange: (status: 'all' | 'pending' | 'ready' | 'read' | 'unread' | 'error' | 'favorites' | 'recent') => void;
  selectedObjective: string | null;
  onObjectiveChange: (objective: string | null) => void;
}

const MobileFilters: React.FC<MobileFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  selectedObjective,
  onObjectiveChange,
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'Tout', icon: BookOpen },
    { value: 'favorites', label: 'Favoris', icon: Star },
    { value: 'recent', label: 'Récents', icon: Clock },
    { value: 'unread', label: 'Non lus', icon: BookOpen },
    { value: 'read', label: 'Lus', icon: CheckCircle },
    { value: 'pending', label: 'En cours', icon: Loader2 },
    { value: 'error', label: 'Erreurs', icon: AlertCircle },
  ] as const;

  const objectives = [
    'Calmer avant le coucher',
    'Gérer les peurs',
    'Développer la confiance',
    'Encourager la créativité',
    'Apprendre les émotions',
    'Favoriser l\'amitié',
  ];

  const getActiveFiltersCount = () => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (selectedObjective) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-3">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une histoire..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filtres collapsibles */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between h-10">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filtres</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="h-5 px-2 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-4 pt-3">
          {/* Filtres de statut */}
          <div>
            <h4 className="text-sm font-medium mb-2">Statut</h4>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                const isActive = statusFilter === option.value;
                
                return (
                  <Button
                    key={option.value}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => onStatusChange(option.value)}
                    className="h-8 px-3 text-xs"
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Filtres d'objectifs */}
          <div>
            <h4 className="text-sm font-medium mb-2">Objectifs</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!selectedObjective ? "default" : "outline"}
                size="sm"
                onClick={() => onObjectiveChange(null)}
                className="h-8 px-3 text-xs"
              >
                Tous
              </Button>
              {objectives.map((objective) => (
                <Button
                  key={objective}
                  variant={selectedObjective === objective ? "default" : "outline"}
                  size="sm"
                  onClick={() => onObjectiveChange(
                    selectedObjective === objective ? null : objective
                  )}
                  className="h-8 px-3 text-xs"
                >
                  {objective}
                </Button>
              ))}
            </div>
          </div>

          {/* Bouton de reset */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onStatusChange('all');
                onObjectiveChange(null);
              }}
              className="w-full h-8 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Réinitialiser les filtres
            </Button>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default MobileFilters;