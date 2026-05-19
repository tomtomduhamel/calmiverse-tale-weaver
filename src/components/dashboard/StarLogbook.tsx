import React, { useRef, useState, useEffect } from 'react';
import { Compass, Clock, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getPoeticObjectiveName } from '@/utils/objectiveTranslations';
import { useNavigate } from 'react-router-dom';

interface ReadItem {
  id: string;
  story_id: string;
  read_at: string;
  story: {
    title: string;
    objective: string | null;
  } | null;
}

interface StarLogbookProps {
  recentReads: ReadItem[];
}

// Gradient mapping by objective keyword for visual distinction
const getObjectiveGradient = (objective: string | null | undefined): string => {
  if (!objective) return 'from-primary/20 via-primary/10 to-transparent';
  const k = objective.toLowerCase();
  if (k.includes('sleep') || k.includes('dark') || k.includes('endormir') || k.includes('bedwetting'))
    return 'from-indigo-500/30 via-indigo-500/10 to-transparent';
  if (k.includes('focus') || k.includes('concentr') || k.includes('school'))
    return 'from-emerald-500/30 via-emerald-500/10 to-transparent';
  if (k.includes('relax') || k.includes('détendre') || k.includes('serenity') || k.includes('agitation'))
    return 'from-sky-500/30 via-sky-500/10 to-transparent';
  if (k.includes('fun') || k.includes('joy') || k.includes('amuser') || k.includes('creativity'))
    return 'from-amber-500/30 via-amber-500/10 to-transparent';
  if (k.includes('fear') || k.includes('anxiety') || k.includes('stress') || k.includes('courage'))
    return 'from-rose-500/30 via-rose-500/10 to-transparent';
  if (k.includes('autonomy') || k.includes('confidence') || k.includes('pride'))
    return 'from-violet-500/30 via-violet-500/10 to-transparent';
  return 'from-primary/25 via-primary/10 to-transparent';
};

export const StarLogbook: React.FC<StarLogbookProps> = ({ recentReads }) => {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const cardWidth = el.scrollWidth / Math.max(recentReads.length, 1);
      const idx = Math.round(el.scrollLeft / cardWidth);
      setActiveIndex(idx);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [recentReads.length]);

  return (
    <div className="p-5 md:p-6 rounded-2xl bg-white/50 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm transition-colors">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-full bg-secondary/15 flex items-center justify-center">
            <Compass className="w-4 h-4 text-secondary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-medium text-foreground dark:text-white leading-tight">
              Carnet stellaire
            </h3>
            <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5">
              Vos dernières explorations
            </p>
          </div>
        </div>
        {recentReads.length > 0 && (
          <span className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-foreground/80 dark:text-white/80">
            {recentReads.length} {recentReads.length > 1 ? 'voyages' : 'voyage'}
          </span>
        )}
      </div>

      {recentReads.length === 0 ? (
        <div className="text-center py-10 opacity-60">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucune exploration récente.</p>
        </div>
      ) : (
        <>
          {/* Horizontal carousel */}
          <div
            ref={scrollerRef}
            className="-mx-5 md:-mx-6 px-5 md:px-6 flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {recentReads.map((item) => {
              const gradient = getObjectiveGradient(item.story?.objective);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/app/reader/${item.story_id}`)}
                  className={`
                    snap-start shrink-0 w-[72%] md:w-[44%] lg:w-[31%]
                    relative overflow-hidden text-left
                    rounded-xl border border-white/15 dark:border-white/10
                    bg-gradient-to-br ${gradient}
                    backdrop-blur-sm
                    p-4 min-h-[150px]
                    flex flex-col justify-between
                    transition-all duration-200
                    hover:scale-[1.02] hover:shadow-lg hover:border-white/30
                    active:scale-[0.98]
                  `}
                >
                  {/* Decorative compass icon */}
                  <div className="absolute top-3 right-3 opacity-30">
                    <Compass className="w-5 h-5 text-foreground dark:text-white" />
                  </div>

                  <div className="pr-7">
                    <h4 className="font-display text-base md:text-lg text-foreground dark:text-white leading-snug line-clamp-3">
                      {item.story?.title || 'Histoire inconnue'}
                    </h4>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {item.story?.objective && (
                      <div className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-foreground/70 dark:text-white/70">
                        {getPoeticObjectiveName(item.story.objective)}
                      </div>
                    )}
                    <div className="flex items-center text-[11px] text-muted-foreground dark:text-white/60">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(item.read_at), { addSuffix: true, locale: fr })}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pagination dots (mobile-first) */}
          {recentReads.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-4 md:hidden">
              {recentReads.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === activeIndex
                      ? 'w-6 bg-secondary'
                      : 'w-1.5 bg-foreground/20 dark:bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
