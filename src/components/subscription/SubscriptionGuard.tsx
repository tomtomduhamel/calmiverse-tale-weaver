import React, { useState } from 'react';
import { useFeatureAccess } from '@/hooks/subscription/useFeatureAccess';
import { useQuotaChecker } from '@/hooks/subscription/useQuotaChecker';
import { useSubscription } from '@/hooks/subscription/useSubscription';
import UpgradePrompt from './UpgradePrompt';
import { useNavigate } from 'react-router-dom';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature?: 'story_series' | 'background_music' | 'audio_generation';
  action?: 'create_story' | 'generate_audio' | 'add_child';
  fallback?: React.ReactNode;
  onBlock?: (reason: string) => void;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  feature,
  action,
  fallback,
  onBlock
}) => {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const { hasAccess } = useFeatureAccess();
  const { validateAction } = useQuotaChecker();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<{
    type: 'stories' | 'audio' | 'children' | 'features';
    message: string;
  }>({ type: 'features', message: '' });

  const checkAccess = async () => {
    // Vérifier l'accès aux fonctionnalités
    if (feature && !hasAccess(feature)) {
      const reason = {
        type: 'features' as const,
        message: `Cette fonctionnalité nécessite un abonnement supérieur à ${subscription?.tier || 'calmini'}.`
      };
      setUpgradeReason(reason);
      setShowUpgradePrompt(true);
      onBlock?.(reason.message);
      return false;
    }

    // Vérifier les quotas d'action
    if (action) {
      const validation = await validateAction(action);
      if (!validation.allowed && validation.reason) {
        const typeMap = {
          'create_story': 'stories' as const,
          'generate_audio': 'audio' as const,
          'add_child': 'children' as const
        };
        
        const reason = {
          type: typeMap[action],
          message: validation.reason
        };
        setUpgradeReason(reason);
        setShowUpgradePrompt(true);
        onBlock?.(reason.message);
        return false;
      }
    }

    return true;
  };

  const handleClick = async (e: React.MouseEvent) => {
    const hasAccess = await checkAccess();
    if (!hasAccess) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  // Si un fallback est fourni et l'accès est refusé, afficher le fallback
  if (fallback && ((feature && !hasAccess(feature)))) {
    return <>{fallback}</>;
  }

  return (
    <>
      <div onClick={handleClick}>
        {children}
      </div>
      
      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        currentTier={subscription?.tier || 'calmini'}
        reason={upgradeReason.type}
        message={upgradeReason.message}
        onUpgrade={handleUpgrade}
      />
    </>
  );
};

export default SubscriptionGuard;