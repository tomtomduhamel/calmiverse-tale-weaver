import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SortAsc, SortDesc, Filter } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChildrenSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: 'name' | 'age' | 'created';
  onSortChange: (value: 'name' | 'age' | 'created') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  ageFilter: 'all' | 'toddler' | 'preschool' | 'school';
  onAgeFilterChange: (value: 'all' | 'toddler' | 'preschool' | 'school') => void;
}

const ChildrenSearchBar: React.FC<ChildrenSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  ageFilter,
  onAgeFilterChange,
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Rechercher un enfant..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
        />
      </div>

      {/* Filters */}
      <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'flex-row'}`}>
        {/* Age Filter */}
        <Select value={ageFilter} onValueChange={onAgeFilterChange}>
          <SelectTrigger className={`bg-background/50 border-border/50 ${isMobile ? 'w-full' : 'w-40'}`}>
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Âge" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les âges</SelectItem>
            <SelectItem value="toddler">0-2 ans</SelectItem>
            <SelectItem value="preschool">3-5 ans</SelectItem>
            <SelectItem value="school">6+ ans</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className={`bg-background/50 border-border/50 ${isMobile ? 'w-full' : 'w-40'}`}>
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nom</SelectItem>
            <SelectItem value="age">Âge</SelectItem>
            <SelectItem value="created">Date de création</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="bg-background/50 border-border/50 hover:bg-primary/10"
        >
          {sortOrder === 'asc' ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          )}
          {!isMobile && <span className="ml-2">{sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}</span>}
        </Button>
      </div>
    </div>
  );
};

export default ChildrenSearchBar;