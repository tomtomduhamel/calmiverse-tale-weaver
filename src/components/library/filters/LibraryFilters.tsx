
import React from 'react';
import SearchBar from '../SearchBar';
import StatusFilter from '../StatusFilter';
import { useIsMobile } from '@/hooks/use-mobile';

interface LibraryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'pending' | 'completed' | 'read' | 'error';
  onStatusChange: (status: 'all' | 'pending' | 'completed' | 'read' | 'error') => void;
}

const LibraryFilters: React.FC<LibraryFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'sm:flex-row'} gap-4 items-start sm:items-center`}>
      <SearchBar value={searchTerm} onChange={onSearchChange} />
      <StatusFilter currentStatus={statusFilter} onStatusChange={onStatusChange} />
    </div>
  );
};

export default LibraryFilters;
