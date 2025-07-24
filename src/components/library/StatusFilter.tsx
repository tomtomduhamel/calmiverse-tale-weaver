
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatusFilterProps {
  statusFilter: 'all' | 'pending' | 'ready' | 'read' | 'error' | 'favorites';
  onStatusChange: (status: 'all' | 'pending' | 'ready' | 'read' | 'error' | 'favorites') => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ statusFilter, onStatusChange }) => {
  return (
    <Select value={statusFilter} onValueChange={onStatusChange}>
      <SelectTrigger className="w-full sm:w-48">
        <SelectValue placeholder="Filtrer par statut" />
      </SelectTrigger>
      <SelectContent className="bg-background border border-border shadow-md">
        <SelectItem value="all">Toutes les histoires</SelectItem>
        <SelectItem value="favorites">⭐ Favoris</SelectItem>
        <SelectItem value="read">✅ Lues</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default StatusFilter;
