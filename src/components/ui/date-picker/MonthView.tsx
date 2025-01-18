import React from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MonthViewProps {
  year: number;
  onSelect: (month: number) => void;
}

export function MonthView({ year, onSelect }: MonthViewProps) {
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(year, i, 1);
    return format(date, "MMMM", { locale: fr });
  });

  return (
    <div className="grid grid-cols-3 gap-2">
      {months.map((month, index) => (
        <Button
          key={month}
          onClick={() => onSelect(index)}
          variant="outline"
          className="w-full capitalize"
        >
          {month}
        </Button>
      ))}
    </div>
  );
}