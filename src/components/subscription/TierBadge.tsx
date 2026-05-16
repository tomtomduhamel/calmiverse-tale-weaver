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
        return 'bg-primary-soft/20 text-primary border-primary-soft/40';
      case 'calmidium':
        return 'bg-accent/30 text-accent-foreground border-accent/50';
      case 'calmix':
        return 'bg-primary/15 text-primary border-primary/30';
      case 'calmixxl':
        return 'bg-gradient-to-r from-primary-soft/30 to-accent/30 text-foreground border-primary/40';
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