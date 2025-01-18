import React from "react";
import { Button } from "@/components/ui/button";

interface YearViewProps {
  onSelect: (year: number) => void;
}

export function YearView({ onSelect }: YearViewProps) {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 12;
  const years = Array.from({ length: 13 }, (_, i) => startYear + i);

  return (
    <div className="grid grid-cols-3 gap-2">
      {years.map((year) => (
        <Button
          key={year}
          onClick={() => onSelect(year)}
          variant="outline"
          className="w-full"
        >
          {year}
        </Button>
      ))}
    </div>
  );
}