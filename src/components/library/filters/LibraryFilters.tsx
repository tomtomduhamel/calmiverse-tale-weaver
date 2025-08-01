
import React from "react";
import SearchBar from "../SearchBar";
import StatusFilter from "../StatusFilter";
import ObjectiveFilter from "./ObjectiveFilter";

interface LibraryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'pending' | 'ready' | 'read' | 'unread' | 'error' | 'favorites' | 'recent';
  onStatusChange: (status: 'all' | 'pending' | 'ready' | 'read' | 'unread' | 'error' | 'favorites' | 'recent') => void;
  selectedObjective: string | null;
  onObjectiveChange: (objective: string | null) => void;
}

const LibraryFilters: React.FC<LibraryFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  selectedObjective,
  onObjectiveChange,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 w-full sm:w-auto">
          <SearchBar searchTerm={searchTerm} onSearchChange={onSearchChange} />
        </div>
        <StatusFilter 
          statusFilter={statusFilter} 
          onStatusChange={onStatusChange} 
        />
      </div>
      <ObjectiveFilter
        selectedObjective={selectedObjective}
        onObjectiveChange={onObjectiveChange}
      />
    </div>
  );
};

export default LibraryFilters;
