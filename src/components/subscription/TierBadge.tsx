import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Zap, Sparkles } from 'lucide-react';
import { SubscriptionTier } from '@/types/subscription';
import { SubscriptionService } from '@/services/SubscriptionService';

interface TierBadgeProps {
  tier: SubscriptionTier;
  variant?: 'default' | 'outline' | 'secondary';
  showIcon?: boolean;
  className?: string;
}

const TierBadge: React.FC<TierBadgeProps> = ({ 
  tier, 
  variant = 'default', 
  showIcon = true,
  className = '' 
}) => {
  const getTierIcon = () => {
    switch (tier) {
      case 'calmini':
        return <Sparkles className="w-3 h-3" />;
      case 'calmidium':
        return <Star className="w-3 h-3" />;
      case 'calmix':
        return <Zap className="w-3 h-3" />;
      case 'calmixxl':
        return <Crown className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getTierColor = () => {
    switch (tier) {
      case 'calmini':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'calmidium':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'calmix':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'calmixxl':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return '';
    }
  };

  const customColor = variant === 'default' ? getTierColor() : '';

  return (
    <Badge 
      variant={variant} 
      className={`${customColor} ${className}`}
    >
      {showIcon && getTierIcon()}
      {showIcon && <span className="ml-1" />}
      {SubscriptionService.getTierDisplayName(tier)}
    </Badge>
  );
};

export default TierBadge;