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
          className: 'bg-primary-soft/15 text-primary border-primary-soft/40',
          iconClassName: 'animate-spin'
        };
      case 'completed':
      case 'ready':
        return {
          icon: CheckCircle,
          label: 'Prête à lire',
          className: 'bg-accent/20 text-accent-foreground border-accent/40',
          iconClassName: ''
        };
      case 'read':
        return {
          icon: BookCheck,
          label: 'Déjà lu',
          className: 'bg-primary/10 text-primary border-primary/30',
          iconClassName: ''
        };
      case 'error':
        return {
          icon: AlertTriangle,
          label: 'Erreur',
          className: 'bg-destructive/10 text-destructive border-destructive/30',
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
