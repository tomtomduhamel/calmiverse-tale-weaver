import React from "react";
import SearchBar from "../SearchBar";
import StatusFilter from "../StatusFilter";

interface LibraryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'pending' | 'completed' | 'read';
  onStatusChange: (value: 'all' | 'pending' | 'completed' | 'read') => void;
}

const LibraryFilters: React.FC<LibraryFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <SearchBar 
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
      />
      <StatusFilter
        value={statusFilter}
        onChange={onStatusChange}
      />
    </div>
  );
};

export default LibraryFilters;