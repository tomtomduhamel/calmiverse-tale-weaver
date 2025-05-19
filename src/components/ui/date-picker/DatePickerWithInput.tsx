
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, isValid, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { YearView } from "./YearView";
import { MonthView } from "./MonthView";
import { DayView } from "./DayView";

export interface DatePickerWithInputProps {
  value: Date;
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
  const [inputValue, setInputValue] = useState(() => 
    isValid(value) ? format(value, "dd MMMM yyyy", { locale: fr }) : ""
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const parsedDate = parse(newValue, "dd MMMM yyyy", new Date(), { locale: fr });
    if (isValid(parsedDate)) {
      onChange(parsedDate);
    }
  };

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
    setInputValue(format(day, "dd MMMM yyyy", { locale: fr }));
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

  return (
    <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder="JJ MMMM AAAA"
            className="border-0 p-0 focus-visible:ring-0"
            onClick={(e) => e.stopPropagation()}
            disabled={disabled}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 max-w-[95vw]" align="start">
        <div className="space-y-4 p-3">
          {currentView !== "year" && (
            <Button
              variant="ghost"
              onClick={handleBackClick}
              className="mb-2"
            >
              Retour
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
