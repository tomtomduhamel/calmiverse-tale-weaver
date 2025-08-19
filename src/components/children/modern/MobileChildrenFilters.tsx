import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  X, 
  User, 
  Heart, 
  Cat,
  ChevronDown,
  Calendar,
  SortAsc,
  SortDesc
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MobileChildrenFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: 'name' | 'age' | 'created';
  onSortChange: (value: 'name' | 'age' | 'created') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  ageFilter: 'all' | 'toddler' | 'preschool' | 'school';
  onAgeFilterChange: (value: 'all' | 'toddler' | 'preschool' | 'school') => void;
  genderFilter: 'all' | 'boy' | 'girl' | 'pet';
  onGenderFilterChange: (value: 'all' | 'boy' | 'girl' | 'pet') => void;
}

const MobileChildrenFilters: React.FC<MobileChildrenFiltersProps> = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  ageFilter,
  onAgeFilterChange,
  genderFilter,
  onGenderFilterChange,
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const genderOptions = [
    { value: 'boy', label: 'Garçons', icon: User, color: 'text-blue-500' },
    { value: 'girl', label: 'Filles', icon: Heart, color: 'text-pink-500' },
    { value: 'pet', label: 'Animaux', icon: Cat, color: 'text-orange-500' },
  ] as const;

  const ageOptions = [
    { value: 'toddler', label: '0-2 ans' },
    { value: 'preschool', label: '3-5 ans' },
    { value: 'school', label: '6+ ans' },
  ] as const;

  const sortOptions = [
    { value: 'name', label: 'Nom' },
    { value: 'age', label: 'Âge' },
    { value: 'created', label: 'Date de création' },
  ] as const;

  const getActiveFiltersCount = () => {
    let count = 0;
    if (genderFilter !== 'all') count++;
    if (ageFilter !== 'all') count++;
    if (sortBy !== 'name' || sortOrder !== 'asc') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-3 px-2">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un enfant..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 bg-background/80 border-border/50"
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
          <Button variant="outline" className="w-full justify-between h-10 bg-background/80">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filtres et tri</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="h-5 px-2 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-4 pt-3">
          {/* Filtres de genre */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Type
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={genderFilter === 'all' ? "default" : "outline"}
                size="sm"
                onClick={() => onGenderFilterChange('all')}
                className="h-8 px-3 text-xs"
              >
                Tous
              </Button>
              {genderOptions.map((option) => {
                const Icon = option.icon;
                const isActive = genderFilter === option.value;
                
                return (
                  <Button
                    key={option.value}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => onGenderFilterChange(option.value)}
                    className="h-8 px-3 text-xs"
                  >
                    <Icon className={`h-3 w-3 mr-1 ${option.color}`} />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Filtres d'âge */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Âge
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={ageFilter === 'all' ? "default" : "outline"}
                size="sm"
                onClick={() => onAgeFilterChange('all')}
                className="h-8 px-3 text-xs"
              >
                Tous les âges
              </Button>
              {ageOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={ageFilter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => onAgeFilterChange(option.value)}
                  className="h-8 px-3 text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Tri */}
          <div>
            <h4 className="text-sm font-medium mb-2">Tri</h4>
            <div className="flex flex-wrap gap-2 mb-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={sortBy === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSortChange(option.value)}
                  className="h-8 px-3 text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-8 px-3 text-xs"
            >
              {sortOrder === 'asc' ? (
                <>
                  <SortAsc className="h-3 w-3 mr-1" />
                  Croissant
                </>
              ) : (
                <>
                  <SortDesc className="h-3 w-3 mr-1" />
                  Décroissant
                </>
              )}
            </Button>
          </div>

          {/* Bouton de reset */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onGenderFilterChange('all');
                onAgeFilterChange('all');
                onSortChange('name');
                onSortOrderChange('asc');
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

export default MobileChildrenFilters;