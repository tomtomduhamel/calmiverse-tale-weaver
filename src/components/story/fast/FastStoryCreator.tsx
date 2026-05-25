import React, { useState, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Loader2, Sparkles, Video, BookOpen, CalendarClock, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import FastStoryCard from './FastStoryCard';
import {
  FAST_STORIES_REGULATION,
  FAST_STORIES_RENFORCEMENT,
  FAST_STORIES_SITUATIONS,
  FastStoryItem,
} from '@/config/fastStoryConfig';
import { useN8nFastStory } from '@/hooks/stories/useN8nFastStory';
import { useQuotaChecker } from '@/hooks/subscription/useQuotaChecker';
import { useSubscription } from '@/hooks/subscription/useSubscription';
import { useStoryRoutines } from '@/hooks/useStoryRoutines';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';
import type { StoryDurationMinutes } from '@/types/story';
import { STORY_DURATION_OPTIONS } from '@/types/story';

const DURATION_OPTIONS = STORY_DURATION_OPTIONS;

const DAY_OPTIONS = [
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'M', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
  { label: 'D', value: 7 },
];

const FastStoryCreator: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createFastStory, isCreatingStory } = useN8nFastStory();
  const { validateAction, incrementUsage } = useQuotaChecker();
  const { subscription, limits } = useSubscription();
  const { createRoutine, hasAutoCreation, checkingAccess } = useStoryRoutines();

  const [selectedItem, setSelectedItem] = useState<FastStoryItem | null>(null);
  const [generateVideo, setGenerateVideo] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [quotaMessage, setQuotaMessage] = useState('');
  const isSubmittingRef = useRef(false);

  // Routine state
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDays, setScheduleDays] = useState<number[]>([]);
  const [scheduleTime, setScheduleTime] = useState('20:30');
  const [creatingRoutine, setCreatingRoutine] = useState(false);

  const canGenerateVideo = (limits?.max_video_intros_per_period || 0) > 0;

  const handleCardClick = (item: FastStoryItem) => {
    setSelectedItem(item);
  };

  const handleCloseDrawer = () => {
    setSelectedItem(null);
    setScheduleEnabled(false);
    setScheduleDays([]);
    setScheduleTime('20:30');
  };

  const handleScheduleToggle = (checked: boolean) => {
    if (checked && hasAutoCreation === false) {
      navigate('/app/subscription');
      return;
    }
    setScheduleEnabled(checked);
  };

  const toggleDay = (day: number) => {
    setScheduleDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleCreateStory = useCallback(async (durationMinutes: StoryDurationMinutes) => {
    if (!selectedItem || isSubmittingRef.current || isCreatingStory) return;

    isSubmittingRef.current = true;

    try {
      const validation = await validateAction('create_story');
      if (!validation.allowed) {
        toast({
          title: 'Limite atteinte',
          description: validation.reason || 'Quota atteint',
          variant: 'destructive',
        });
        setQuotaMessage(validation.reason || 'Limite atteinte');
        setShowUpgradePrompt(true);
        return;
      }

      let useVideo = generateVideo;
      if (useVideo) {
        const videoValidation = await validateAction('show_video_intro');
        if (!videoValidation?.allowed) {
          toast({
            title: 'Quota vidéo atteint',
            description: "Votre quota de vidéos est épuisé. L'histoire sera générée sans vidéo.",
            variant: 'destructive',
          });
          useVideo = false;
        }
      }

      // Créer la routine si activée
      if (scheduleEnabled && scheduleDays.length > 0) {
        setCreatingRoutine(true);
        try {
          await createRoutine({
            mode: 'fast',
            fast_story_prompt_key: selectedItem.promptKey,
            duration_minutes: durationMinutes,
            generate_video: useVideo,
            schedule_type: 'weekly',
            days_of_week: scheduleDays,
            time_of_day: scheduleTime,
            timezone: 'Europe/Paris',
            is_active: true,
          });
          toast({
            title: '🎉 Routine créée !',
            description: `${scheduleDays.length} jour(s)/semaine à ${scheduleTime} — histoires automatiques activées.`,
          });
        } catch {
          toast({
            title: 'Routine non créée',
            description: 'Une erreur est survenue. Réessayez depuis Gérer mes routines.',
            variant: 'destructive',
          });
        } finally {
          setCreatingRoutine(false);
        }
      }

      await createFastStory({
        promptKey: selectedItem.promptKey,
        durationMinutes,
        generateVideo: useVideo,
      });

      await incrementUsage('story');

      toast({
        title: '✨ Création lancée !',
        description: 'Vous recevrez une notification quand votre histoire sera prête.',
      });

      handleCloseDrawer();
      navigate('/library');
    } catch (error: any) {
      console.error('[FastStoryCreator] Erreur création:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Impossible de créer l'histoire",
        variant: 'destructive',
      });
    } finally {
      isSubmittingRef.current = false;
    }
  }, [selectedItem, generateVideo, scheduleEnabled, scheduleDays, scheduleTime, isCreatingStory, validateAction, createFastStory, createRoutine, incrementUsage, toast, navigate]);

  const renderCardGrid = (items: FastStoryItem[], label: string, color?: string) => (
    <div className="space-y-3">
      {label && (
        <p className={`text-xs font-semibold uppercase tracking-wider px-1 ${color || 'text-muted-foreground'}`}>
          {label}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map(item => (
          <FastStoryCard
            key={item.id}
            item={item}
            onClick={handleCardClick}
            disabled={isCreatingStory}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        currentTier={subscription?.tier || 'calmini'}
        reason="stories"
        message={quotaMessage}
        onUpgrade={() => navigate('/pricing')}
        onCancel={() => setShowUpgradePrompt(false)}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
            <Sparkles className="w-4 h-4" />
            Histoires rapides
          </div>
          <h1 className="text-xl font-semibold text-foreground/90">
            De quoi votre enfant a-t-il besoin ?
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choisissez un thème pour générer une histoire adaptée en un instant.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="emotion" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="emotion" className="gap-2">
              <span>✨</span>
              Émotion
            </TabsTrigger>
            <TabsTrigger value="situation" className="gap-2">
              <span>🧭</span>
              Situation
            </TabsTrigger>
          </TabsList>

          {/* Tab: Émotion */}
          <TabsContent value="emotion" className="space-y-6 mt-0">
            {renderCardGrid(FAST_STORIES_REGULATION, '🌙 Pour apaiser', 'text-blue-400')}
            <div className="border-t border-border/50 pt-6">
              {renderCardGrid(FAST_STORIES_RENFORCEMENT, '☀️ Pour stimuler', 'text-amber-400')}
            </div>
          </TabsContent>

          {/* Tab: Situation */}
          <TabsContent value="situation" className="mt-0">
            {renderCardGrid(FAST_STORIES_SITUATIONS, '')}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Drawer — Duration & Options */}
      <Drawer open={!!selectedItem} onOpenChange={open => !open && handleCloseDrawer()}>
        <DrawerContent>
          {selectedItem && (
            <div className="px-4 pb-8 pt-2 max-w-md mx-auto w-full">
              <DrawerHeader className="text-center px-0">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-4xl">{selectedItem.icon}</span>
                </div>
                <DrawerTitle className="text-lg">{selectedItem.label}</DrawerTitle>
                <DrawerDescription className="text-sm text-muted-foreground mt-1">
                  {selectedItem.description}
                </DrawerDescription>
              </DrawerHeader>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-3 mt-2">
                {scheduleEnabled && scheduleDays.length > 0
                  ? 'Choisir la durée et planifier'
                  : 'Quelle durée ?'}
              </p>

              {/* Duration buttons */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {DURATION_OPTIONS.map(duration => (
                  <Button
                    key={duration}
                    variant="secondary"
                    className="h-12 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={() => handleCreateStory(duration)}
                    disabled={isCreatingStory || creatingRoutine}
                  >
                    {isCreatingStory || creatingRoutine ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : scheduleEnabled && scheduleDays.length > 0 ? (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {duration} min
                      </span>
                    ) : (
                      `${duration} min`
                    )}
                  </Button>
                ))}
              </div>

              {/* Video toggle */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Vidéo magique</span>
                  {!canGenerateVideo && (
                    <span className="text-[10px] text-muted-foreground">(Calmix+)</span>
                  )}
                </div>
                <Switch
                  checked={generateVideo}
                  onCheckedChange={setGenerateVideo}
                  disabled={!canGenerateVideo || isCreatingStory}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {/* Routine toggle */}
              <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Répéter automatiquement</span>
                    {!checkingAccess && hasAutoCreation === false && (
                      <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        <Lock className="h-3 w-3" />
                        Calmix
                      </span>
                    )}
                  </div>
                  <Switch
                    checked={scheduleEnabled}
                    onCheckedChange={handleScheduleToggle}
                    disabled={checkingAccess || isCreatingStory || creatingRoutine}
                    aria-label="Activer la répétition automatique"
                  />
                </div>

                {scheduleEnabled && (
                  <div className="space-y-4 pt-1 border-t border-primary/10 animate-fade-in">
                    {/* Jours */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Jours de la semaine
                      </p>
                      <div className="flex gap-1.5">
                        {DAY_OPTIONS.map((day, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleDay(day.value)}
                            className={`w-9 h-9 rounded-full text-xs font-semibold transition-all duration-200 ${
                              scheduleDays.includes(day.value)
                                ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                            aria-pressed={scheduleDays.includes(day.value)}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                      {scheduleDays.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          ~{Math.ceil(scheduleDays.length * 4.33)} histoires/mois
                        </p>
                      )}
                    </div>

                    {/* Heure */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Heure
                      </p>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="p-2 border border-border rounded-lg bg-background text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Quota info */}
              {subscription && limits && (
                <div className="flex flex-col items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span>
                      {subscription.stories_used_this_period}/{limits.stories_per_month} histoires utilisées ce mois
                    </span>
                  </div>
                  {canGenerateVideo && (
                    <div className="flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      <span>
                        {subscription.video_intros_used_this_period}/{limits.max_video_intros_per_period} vidéos magiques ce mois
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default FastStoryCreator;
