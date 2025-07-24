
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatusFilterProps {
  statusFilter: 'all' | 'pending' | 'ready' | 'read' | 'unread' | 'error' | 'favorites' | 'recent';
  onStatusChange: (status: 'all' | 'pending' | 'ready' | 'read' | 'unread' | 'error' | 'favorites' | 'recent') => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ statusFilter, onStatusChange }) => {
  return (
    <Select value={statusFilter} onValueChange={onStatusChange}>
      <SelectTrigger className="w-full sm:w-48">
        <SelectValue placeholder="Filtrer par statut" />
      </SelectTrigger>
      <SelectContent className="bg-background border border-border shadow-md">
        <SelectItem value="all">Toutes les histoires</SelectItem>
        <SelectItem value="recent">✨ Nouvelles histoires</SelectItem>
        <SelectItem value="favorites">⭐ Favoris</SelectItem>
        <SelectItem value="unread">📖 Non lues</SelectItem>
        <SelectItem value="read">✅ Lues</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default StatusFilter;
