
import React from 'react';
import HomeHero from '@/components/home/HomeHero';
import type { ViewType } from '@/types/views';
import type { Child } from '@/types/child';
import { BackgroundGenerationIndicator } from '@/components/stories/BackgroundGenerationIndicator';
import { PWANotificationBanner } from '@/components/notifications/PWANotificationBanner';

interface HomeViewProps {
  onViewChange: (view: ViewType) => void;
  showGuide?: boolean;
  children?: Child[];
}

const HomeView: React.FC<HomeViewProps> = ({ onViewChange, showGuide, children }) => {
  // Debug: Vérifier la transmission des enfants dans HomeView
  console.log('[HomeView] Props reçues:', {
    childrenCount: children?.length || 0,
    children: children?.map(c => ({ id: c.id, name: c.name })) || [],
    showGuide
  });

  return (
    <div className="min-h-screen w-full">
      <div className="container mx-auto px-4 pt-4 space-y-4">
        <PWANotificationBanner />
        <BackgroundGenerationIndicator />
      </div>
      <HomeHero 
        onViewChange={onViewChange} 
        children={children || []} 
      />
    </div>
  );
};

export default HomeView;
