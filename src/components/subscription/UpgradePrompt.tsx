import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Star } from 'lucide-react';
import { SubscriptionService } from '@/services/SubscriptionService';
import { SubscriptionTier } from '@/types/subscription';

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: SubscriptionTier;
  reason: 'stories' | 'audio' | 'children' | 'features';
  message: string;
  onUpgrade: () => void;
  onCancel?: () => void;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  open,
  onOpenChange,
  currentTier,
  reason,
  message,
  onUpgrade,
  onCancel
}) => {
  const recommendedTier = SubscriptionService.getUpgradeRecommendation(currentTier, reason);
  
  const getReasonIcon = () => {
    switch (reason) {
      case 'stories':
        return '📚';
      case 'audio':
        return '🎵';
      case 'children':
        return '👶';
      case 'features':
        return '⭐';
      default:
        return '🚀';
    }
  };

  const getReasonTitle = () => {
    switch (reason) {
      case 'stories':
        return 'Limite d\'histoires atteinte';
      case 'audio':
        return 'Génération audio non disponible';
      case 'children':
        return 'Limite d\'enfants atteinte';
      case 'features':
        return 'Fonctionnalité premium';
      default:
        return 'Mise à niveau recommandée';
    }
  };

  const getBenefits = () => {
    switch (reason) {
      case 'stories':
        return [
          'Plus d\'histoires chaque mois',
          'Créativité illimitée pour vos enfants',
          'Accès à toutes les fonctionnalités'
        ];
      case 'audio':
        return [
          'Génération audio haute qualité',
          'Histoires racontées avec des voix naturelles',
          'Expérience immersive pour les enfants'
        ];
      case 'children':
        return [
          'Ajoutez plus d\'enfants à votre compte',
          'Histoires personnalisées pour toute la famille',
          'Gestion flexible des profils'
        ];
      case 'features':
        return [
          'Accès aux suites d\'histoires',
          'Musique de fond',
          'Fonctionnalités exclusives'
        ];
      default:
        return ['Plus de fonctionnalités', 'Meilleure expérience', 'Support prioritaire'];
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleUpgrade = () => {
    onUpgrade();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{getReasonIcon()}</span>
            <AlertDialogTitle>{getReasonTitle()}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-4">
            <p>{message}</p>
            
            {recommendedTier && (
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="font-medium">Plan recommandé</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">
                      {SubscriptionService.getTierDisplayName(recommendedTier)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {SubscriptionService.getTierDescription(recommendedTier)}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <Star className="w-3 h-3 mr-1" />
                    Populaire
                  </Badge>
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-2">Avantages de la mise à niveau :</h4>
              <ul className="text-sm space-y-1">
                {getBenefits().map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Plus tard
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleUpgrade}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Mettre à niveau
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UpgradePrompt;