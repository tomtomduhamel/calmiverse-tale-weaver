
import React from "react";
import HomeHero from "@/components/home/HomeHero";
import type { ViewType } from "@/types/views";
import { InteractiveGuide } from "@/components/guide/InteractiveGuide";

interface HomeViewProps {
  onViewChange: (view: ViewType) => void;
  showGuide: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({ onViewChange, showGuide }) => {
  return (
    <div className="h-full w-full">
      {showGuide && <InteractiveGuide />}
      <HomeHero onViewChange={onViewChange} />
    </div>
  );
};
