import React from 'react';
import { TestingDashboard } from '@/components/testing/TestingDashboard';

/**
 * Page dédiée aux tests Phase 6
 * Accessible uniquement en mode développement via /testing
 */
export const TestingPage: React.FC = () => {
  return <TestingDashboard />;
};