
import React from "react";
import SearchBar from "./SearchBar";
import StatusFilter from "./StatusFilter";

interface StoryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'pending' | 'completed' | 'read' | 'error';
  onStatusChange: (status: 'all' | 'pending' | 'completed' | 'read' | 'error') => void;
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
        value={searchTerm}
        onChange={onSearchChange}
      />
      <StatusFilter
        currentStatus={statusFilter}
        onStatusChange={onStatusChange}
      />
    </div>
  );
};

export default StoryFilters;
