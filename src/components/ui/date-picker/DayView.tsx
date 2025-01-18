import React from "react";
import { Button } from "@/components/ui/button";
import { getDaysInMonth, startOfMonth, format, addDays, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

interface DayViewProps {
  year: number;
  month: number;
  onSelect: (date: Date) => void;
}

export function DayView({ year, month, onSelect }: DayViewProps) {
  const firstDayOfMonth = startOfMonth(new Date(year, month));
  const daysInMonth = getDaysInMonth(firstDayOfMonth);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const today = new Date();

  // Adjust for Monday as first day of week
  const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  const days = Array.from({ length: 42 }, (_, i) => {
    const dayIndex = i - adjustedStartingDay;
    if (dayIndex < 0 || dayIndex >= daysInMonth) return null;
    return addDays(firstDayOfMonth, dayIndex);
  });

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {weekDays.map((day) => (
          <div key={day} className="text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          
          const isToday = isSameDay(day, today);
          
          return (
            <Button
              key={i}
              onClick={() => onSelect(day)}
              variant={isToday ? "default" : "outline"}
              className="w-full h-9 p-0"
            >
              {format(day, "d")}
            </Button>
          );
        })}
      </div>
    </div>
  );
}