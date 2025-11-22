import React from 'react';
import { CheckCircle, BookCheck, Loader2, AlertTriangle, Clock } from 'lucide-react';
import type { Story } from '@/types/story';

interface SeriesStoryCardStatusProps {
  status: Story['status'];
  progress?: number;
  tomeNumber?: number;
}

/**
 * Composant de statut visuel pour les cartes d'histoires dans une série
 * Remplace le badge "En cours" par des indicateurs visuels clairs et informatifs
 */
export const SeriesStoryCardStatus: React.FC<SeriesStoryCardStatusProps> = ({
  status,
  progress,
  tomeNumber
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Loader2,
          label: progress ? `Génération ${progress}%` : 'Génération en cours',
          className: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400',
          iconClassName: 'animate-spin'
        };
      case 'completed':
      case 'ready':
        return {
          icon: CheckCircle,
          label: 'Prête à lire',
          className: 'bg-green-500/10 text-green-700 border-green-500/30 dark:bg-green-500/20 dark:text-green-400',
          iconClassName: ''
        };
      case 'read':
        return {
          icon: BookCheck,
          label: 'Déjà lu',
          className: 'bg-blue-500/10 text-blue-700 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400',
          iconClassName: ''
        };
      case 'error':
        return {
          icon: AlertTriangle,
          label: 'Erreur',
          className: 'bg-red-500/10 text-red-700 border-red-500/30 dark:bg-red-500/20 dark:text-red-400',
          iconClassName: ''
        };
      default:
        return {
          icon: Clock,
          label: 'En attente',
          className: 'bg-muted text-muted-foreground border-border',
          iconClassName: ''
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded-lg border
      transition-all duration-200
      ${config.className}
    `}>
      <Icon className={`w-4 h-4 ${config.iconClassName}`} />
      <span className="text-xs font-medium">{config.label}</span>
    </div>
  );
};
