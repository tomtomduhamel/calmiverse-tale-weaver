import React from "react";
import SearchBar from "./SearchBar";
import StatusFilter from "./StatusFilter";

interface StoryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'pending' | 'completed';
  onStatusChange: (value: 'all' | 'pending' | 'completed') => void;
}

const StoryFilters: React.FC<StoryFiltersProps> = ({
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

export default StoryFilters;