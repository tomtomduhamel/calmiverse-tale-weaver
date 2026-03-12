import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface YearViewProps {
  onSelect: (year: number) => void;
}

const YEARS_PER_PAGE = 12;

export function YearView({ onSelect }: YearViewProps) {
  const currentYear = new Date().getFullYear();
  const [pageEnd, setPageEnd] = useState(currentYear);

  const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => pageEnd - YEARS_PER_PAGE + 1 + i);

  const canGoNext = pageEnd < currentYear;
  const canGoPrev = pageEnd - YEARS_PER_PAGE >= 1920;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPageEnd((p) => p - YEARS_PER_PAGE)}
          disabled={!canGoPrev}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-muted-foreground">
          {years[0]} – {years[years.length - 1]}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPageEnd((p) => p + YEARS_PER_PAGE)}
          disabled={!canGoNext}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {years.map((year) => (
          <Button
            key={year}
            onClick={() => onSelect(year)}
            variant={year === currentYear ? "default" : "outline"}
            className="w-full"
          >
            {year}
          </Button>
        ))}
      </div>
    </div>
  );
}
