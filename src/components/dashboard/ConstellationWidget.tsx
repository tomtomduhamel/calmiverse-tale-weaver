import React, { useMemo } from 'react';
import { BookOpen, Sparkles, Star } from 'lucide-react';
import { getPoeticObjectiveName } from '@/utils/objectiveTranslations';

interface ConstellationWidgetProps {
  totalReads: number;
  objectiveStats: Record<string, number>;
}

// Paliers de progression du ciel
const MILESTONES = [10, 25, 50, 100, 200, 350, 500, 750, 1000, 1500, 2500];

const getNextMilestone = (total: number) => {
  const next = MILESTONES.find((m) => m > total);
  if (next) return { next, previous: MILESTONES[MILESTONES.indexOf(next) - 1] ?? 0 };
  // Au-delà du dernier palier : tranche de 1000
  const base = Math.floor(total / 1000) * 1000;
  return { next: base + 1000, previous: base };
};

// Rang basé sur le nombre d'expéditions sur un thème
const getRankForCount = (count: number): string => {
  if (count >= 50) return 'MAÎTRE';
  if (count >= 25) return 'EXPERT';
  if (count >= 10) return 'EXPLORATEUR';
  if (count >= 5) return 'ÉCLAIREUR';
  return 'NOVICE';
};

export const ConstellationWidget: React.FC<ConstellationWidgetProps> = ({ totalReads, objectiveStats }) => {
  const topObjectives = useMemo(
    () =>
      Object.entries(objectiveStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3),
    [objectiveStats]
  );

  const { next, previous } = getNextMilestone(totalReads);
  const progressPct = Math.min(100, Math.max(0, ((totalReads - previous) / (next - previous)) * 100));

  const first = topObjectives[0];
  const second = topObjectives[1];
  const third = topObjectives[2];

  return (
    <div
      className="relative overflow-hidden h-full min-h-[360px] rounded-2xl shadow-xl flex flex-col
                 bg-gradient-to-br from-[#1d3557] via-[#1d3557] to-[#2a4a6e]
                 dark:from-[#0f1b2d] dark:via-[#152740] dark:to-[#1d3557]
                 border border-[#457B9D]/30"
    >
      {/* Halos d'ambiance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-[#B7E4C7] opacity-10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-[#A8DADC] opacity-10 blur-[120px] rounded-full" />
        {/* Petites étoiles décoratives */}
        <span className="absolute top-10 left-1/4 w-1 h-1 bg-white rounded-full opacity-40 animate-pulse" />
        <span className="absolute top-24 right-1/3 w-0.5 h-0.5 bg-white rounded-full opacity-30" />
        <span className="absolute bottom-24 left-1/2 w-1.5 h-1.5 bg-[#B7E4C7] rounded-full opacity-40 animate-pulse" />
        <span className="absolute top-1/2 right-12 w-1 h-1 bg-[#A8DADC] rounded-full opacity-30 animate-pulse" />
        <span className="absolute bottom-32 left-10 w-0.5 h-0.5 bg-white rounded-full opacity-30" />
      </div>

      {/* En-tête */}
      <div className="relative z-10 p-6 pb-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#457B9D]/50 rounded-lg backdrop-blur-sm">
            <BookOpen className="w-5 h-5 text-[#A8DADC]" />
          </div>
          <h3 className="text-xl font-semibold text-white">L'amas des histoires</h3>
        </div>
        <p className="text-sm text-[#A8DADC] leading-relaxed">
          Parmi tes <span className="text-white font-bold">{totalReads} expédition{totalReads > 1 ? 's' : ''}</span>{' '}
          au total, voici les 3 mondes où tu aimes le plus voyager :
        </p>
      </div>

      {/* Constellation */}
      <div className="relative z-10 flex-grow flex items-center justify-center py-8 px-4 sm:px-8">
        {totalReads === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-white/80 py-8">
            <div className="w-16 h-16 border-2 border-dashed border-[#A8DADC]/40 rounded-full mb-4 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-[#B7E4C7]" />
            </div>
            <p className="text-sm">
              Le ciel est encore vide.
              <br />
              Lis ta première histoire pour allumer l'univers.
            </p>
          </div>
        ) : (
          <>
            {/* Lignes de constellation */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
              viewBox="0 0 500 200"
              preserveAspectRatio="none"
            >
              <path
                d="M100 130 L250 60 L400 140"
                stroke="#B7E4C7"
                strokeWidth="1"
                strokeDasharray="4 4"
                fill="none"
              />
            </svg>

            <div className="grid grid-cols-3 w-full gap-2 sm:gap-4 items-end relative">
              {/* Rang 2 - Gauche */}
              <ConstellationStar
                count={second?.[1] ?? 0}
                name={second ? getPoeticObjectiveName(second[0]) : ''}
                size="md"
                color="secondary"
                hidden={!second}
              />

              {/* Rang 1 - Centre, surélevé */}
              <ConstellationStar
                count={first?.[1] ?? 0}
                name={first ? getPoeticObjectiveName(first[0]) : ''}
                size="lg"
                color="primary"
                hidden={!first}
                elevated
              />

              {/* Rang 3 - Droite */}
              <ConstellationStar
                count={third?.[1] ?? 0}
                name={third ? getPoeticObjectiveName(third[0]) : ''}
                size="sm"
                color="tertiary"
                hidden={!third}
              />
            </div>
          </>
        )}
      </div>

      {/* Barre de progression du ciel */}
      <div className="relative z-10 p-5 bg-black/25 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] uppercase tracking-wider text-[#A8DADC] font-bold flex items-center gap-1.5">
            <Star className="w-3 h-3 fill-[#B7E4C7] text-[#B7E4C7]" />
            Progression du ciel
          </span>
          <span className="text-[10px] text-white font-bold">
            Prochain palier : {next}
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#457B9D]/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#B7E4C7] to-[#A8DADC] shadow-[0_0_10px_rgba(183,228,199,0.5)] transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[10px] text-white/60 mt-1.5">
          Encore {Math.max(0, next - totalReads)} expédition{next - totalReads > 1 ? 's' : ''} pour franchir le prochain palier.
        </p>
      </div>
    </div>
  );
};

type StarProps = {
  count: number;
  name: string;
  size: 'sm' | 'md' | 'lg';
  color: 'primary' | 'secondary' | 'tertiary';
  elevated?: boolean;
  hidden?: boolean;
};

const ConstellationStar: React.FC<StarProps> = ({ count, name, size, color, elevated, hidden }) => {
  if (hidden) return <div />;

  const sizeMap = {
    sm: { outer: 'w-14 h-14', inner: 'w-8 h-8', border: 'border', badge: false },
    md: { outer: 'w-16 h-16', inner: 'w-10 h-10', border: 'border-2', badge: true },
    lg: { outer: 'w-24 h-24', inner: 'w-16 h-16', border: 'border-4', badge: true },
  } as const;

  const colorMap = {
    primary: {
      border: 'border-[#B7E4C7]',
      glow: 'bg-[#B7E4C7]',
      inner: 'bg-gradient-to-tr from-[#B7E4C7] to-[#A8DADC]',
      label: 'text-[#B7E4C7]',
      shadow: 'shadow-[0_0_20px_rgba(183,228,199,0.35)]',
    },
    secondary: {
      border: 'border-[#A8DADC]',
      glow: 'bg-[#A8DADC]',
      inner: 'bg-[#A8DADC]/80',
      label: 'text-[#A8DADC]',
      shadow: '',
    },
    tertiary: {
      border: 'border-[#457B9D]',
      glow: 'bg-[#457B9D]',
      inner: 'bg-[#457B9D]/70',
      label: 'text-[#A8DADC]/80',
      shadow: '',
    },
  } as const;

  const s = sizeMap[size];
  const c = colorMap[color];
  const rank = getRankForCount(count);

  return (
    <div className={`flex flex-col items-center group ${elevated ? '-translate-y-6 sm:-translate-y-8' : ''}`}>
      <div className="relative">
        <div className={`absolute inset-0 ${c.glow} blur-xl opacity-25 group-hover:opacity-50 transition-opacity`} />
        <div
          className={`${s.outer} ${s.border} ${c.border} ${c.shadow} rounded-full flex items-center justify-center relative bg-[#1d3557]`}
        >
          <div className={`${s.inner} rounded-full ${c.inner} flex items-center justify-center`}>
            {size === 'lg' && <Star className="w-7 h-7 text-[#1d3557] fill-[#1d3557]" />}
          </div>
          {s.badge && size !== 'lg' && (
            <span className="absolute -top-2 -right-2 bg-[#B7E4C7] text-[#1d3557] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#1d3557]">
              {rank}
            </span>
          )}
          {size === 'lg' && (
            <span className="absolute -bottom-3 px-3 py-1 bg-[#B7E4C7] text-[#1d3557] text-[10px] font-black rounded-full shadow-lg whitespace-nowrap">
              {rank}
            </span>
          )}
        </div>
      </div>
      <div className={`text-center ${size === 'lg' ? 'mt-6' : 'mt-4'} px-1`}>
        <span
          className={`block text-white leading-tight ${
            size === 'lg' ? 'font-bold text-base sm:text-lg' : 'font-medium text-xs sm:text-sm'
          }`}
        >
          {name}
        </span>
        <span className={`${c.label} text-[10px] sm:text-xs uppercase tracking-widest font-bold mt-1 block`}>
          {count} voyage{count > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};
