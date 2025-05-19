
import React from 'react';
import HomeHero from '@/components/home/HomeHero';
import type { ViewType } from '@/types/views';

interface HomeViewProps {
  onViewChange: (view: ViewType) => void;
  showGuide?: boolean;
}

const HomeView: React.FC<HomeViewProps> = ({ onViewChange, showGuide }) => {
  return (
    <div className="px-4 py-8">
      <HomeHero onViewChange={onViewChange} />
    </div>
  );
};

export default HomeView;
