
import React from "react";
import SearchBar from "../SearchBar";
import StatusFilter from "../StatusFilter";

interface LibraryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'pending' | 'ready' | 'read' | 'unread' | 'error' | 'favorites' | 'recent';
  onStatusChange: (status: 'all' | 'pending' | 'ready' | 'read' | 'unread' | 'error' | 'favorites' | 'recent') => void;
}

const LibraryFilters: React.FC<LibraryFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="flex-1 w-full sm:w-auto">
        <SearchBar searchTerm={searchTerm} onSearchChange={onSearchChange} />
      </div>
      <StatusFilter 
        statusFilter={statusFilter} 
        onStatusChange={onStatusChange} 
      />
    </div>
  );
};

export default LibraryFilters;
