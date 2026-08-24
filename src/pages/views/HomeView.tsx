
import React from 'react';
import HomeHero from '@/components/home/HomeHero';
import type { ViewType } from '@/types/views';
import type { Child } from '@/types/child';
import { BackgroundGenerationIndicator } from '@/components/stories/BackgroundGenerationIndicator';
import { ActiveGenerationsCard } from '@/components/home/ActiveGenerationsCard';
import { PWANotificationBanner } from '@/components/notifications/PWANotificationBanner';

interface HomeViewProps {
  showGuide?: boolean;
  children?: Child[];
}

/**
 * PHASE 2: HomeView simplifié - plus de onViewChange
 * La navigation est gérée par les composants enfants via useAppNavigation
 */
const HomeView: React.FC<HomeViewProps> = ({ showGuide, children }) => {
  // Debug: Vérifier la transmission des enfants dans HomeView
  console.log('[HomeView] Props reçues:', {
    childrenCount: children?.length || 0,
    children: children?.map(c => ({ id: c.id, name: c.name })) || [],
    showGuide
  });

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <div className="container mx-auto px-2 pt-1 empty:hidden">
        <PWANotificationBanner />
        <ActiveGenerationsCard />
      </div>
      <HomeHero 
        children={children || []} 
      />
    </div>
  );
};

export default HomeView;
