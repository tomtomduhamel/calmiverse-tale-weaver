
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { YearView } from "./YearView";
import { MonthView } from "./MonthView";
import { DayView } from "./DayView";

export interface DatePickerWithInputProps {
  value: Date | undefined;
  onChange: (date: Date) => void;
  className?: string;
  disabled?: boolean;
}

type DateView = "year" | "month" | "day";

export function DatePickerWithInput({ value, onChange, className, disabled = false }: DatePickerWithInputProps) {
  const [open, setOpen] = useState(false);
  const [currentView, setCurrentView] = useState<DateView>("year");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setCurrentView("month");
  };

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setCurrentView("day");
  };

  const handleDaySelect = (day: Date) => {
    onChange(day);
    setOpen(false);
    resetViews();
  };

  const handleBackClick = () => {
    if (currentView === "day") {
      setCurrentView("month");
      setSelectedMonth(null);
    } else if (currentView === "month") {
      setCurrentView("year");
      setSelectedYear(null);
    }
  };

  const resetViews = () => {
    setCurrentView("year");
    setSelectedYear(null);
    setSelectedMonth(null);
  };

  const hasValidDate = isValid(value);

  return (
    <Popover modal={false} open={disabled ? false : open} onOpenChange={(o) => {
      if (!disabled) {
        setOpen(o);
        if (!o) resetViews();
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !hasValidDate && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {hasValidDate ? format(value, "dd MMMM yyyy", { locale: fr }) : "Choisir une date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 max-w-[95vw] pointer-events-auto" align="start">
        <div className="space-y-4 p-3">
          {currentView !== "year" && (
            <Button
              variant="ghost"
              onClick={handleBackClick}
              className="mb-2"
            >
              ← Retour
            </Button>
          )}
          
          {currentView === "year" && (
            <YearView onSelect={handleYearSelect} />
          )}
          
          {currentView === "month" && selectedYear && (
            <MonthView 
              year={selectedYear}
              onSelect={handleMonthSelect}
            />
          )}
          
          {currentView === "day" && selectedYear && selectedMonth !== null && (
            <DayView
              year={selectedYear}
              month={selectedMonth}
              onSelect={handleDaySelect}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
