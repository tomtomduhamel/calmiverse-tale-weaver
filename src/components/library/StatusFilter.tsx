
import React from "react";
import { Check, Clock, Book, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface StatusFilterProps {
  currentStatus: 'all' | 'pending' | 'completed' | 'read' | 'error';
  onStatusChange: (status: 'all' | 'pending' | 'completed' | 'read' | 'error') => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ currentStatus, onStatusChange }) => {
  const statuses = [
    { value: 'all', label: 'Tous', icon: null },
    { value: 'pending', label: 'En cours', icon: <Clock className="h-4 w-4 text-yellow-500" /> },
    { value: 'completed', label: 'Complétées', icon: <Check className="h-4 w-4 text-green-500" /> },
    { value: 'read', label: 'Lues', icon: <Book className="h-4 w-4 text-blue-500" /> },
    { value: 'error', label: 'En erreur', icon: <AlertCircle className="h-4 w-4 text-red-500" /> },
  ] as const;

  const currentStatusObj = statuses.find(status => status.value === currentStatus) || statuses[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1">
          <span>Statut:</span>
          {currentStatusObj.icon}
          <span className="ml-1">{currentStatusObj.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {statuses.map((status) => (
          <React.Fragment key={status.value}>
            <DropdownMenuItem
              className="flex items-center cursor-pointer"
              onClick={() => onStatusChange(status.value)}
            >
              {status.icon && <span className="mr-2">{status.icon}</span>}
              <span>{status.label}</span>
              {status.value === currentStatus && (
                <Check className="h-4 w-4 ml-auto text-primary" />
              )}
            </DropdownMenuItem>
            {status.value !== 'error' && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StatusFilter;
