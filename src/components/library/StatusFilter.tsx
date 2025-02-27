
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StatusFilterProps {
  currentStatus: 'all' | 'pending' | 'completed' | 'read' | 'error';
  onStatusChange: (status: 'all' | 'pending' | 'completed' | 'read' | 'error') => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ currentStatus, onStatusChange }) => {
  const statuses: { value: 'all' | 'pending' | 'completed' | 'read' | 'error', label: string }[] = [
    { value: 'all', label: 'Toutes' },
    { value: 'pending', label: 'En cours' },
    { value: 'completed', label: 'Terminées' },
    { value: 'read', label: 'Lues' },
    { value: 'error', label: 'En erreur' }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <Button
          key={status.value}
          variant={currentStatus === status.value ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange(status.value)}
          className="text-xs rounded-full px-4"
        >
          {status.label}
          {status.value === 'error' && (
            <Badge className="ml-2 bg-red-500 text-xs" variant="outline">!</Badge>
          )}
        </Button>
      ))}
    </div>
  );
};

export default StatusFilter;
