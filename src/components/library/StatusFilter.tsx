import React from "react";

interface StatusFilterProps {
  value: 'all' | 'pending' | 'completed';
  onChange: (value: 'all' | 'pending' | 'completed') => void;
}

const StatusFilter = ({ value, onChange }: StatusFilterProps) => {
  return (
    <select
      className="px-4 py-2 border rounded-md bg-white"
      value={value}
      onChange={(e) => onChange(e.target.value as 'all' | 'pending' | 'completed')}
    >
      <option value="all">Tous les statuts</option>
      <option value="pending">En cours</option>
      <option value="completed">Terminées</option>
    </select>
  );
};

export default StatusFilter;