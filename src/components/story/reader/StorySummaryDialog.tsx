import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';
import { Settings } from "lucide-react";
import type { Story } from "@/types/story";
import StorySettingsDialog from "./StorySettingsDialog";
import { useStoryManagement } from "@/hooks/useStoryManagement";
interface StorySummaryDialogProps {
  story: Story;
  showSummary: boolean;
  setShowSummary: (show: boolean) => void;
}
export const StorySummaryDialog: React.FC<StorySummaryDialogProps> = ({
  story,
  showSummary,
  setShowSummary
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const {
    handleRegenerateStory
  } = useStoryManagement();
  return <>
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto animate-fade-in">
          <DialogHeader>
            <DialogTitle className="flex justify-center items-center">
              <span>Résumé & Guide de lecture</span>
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">Résumé de l'histoire</TabsTrigger>
              <TabsTrigger value="guide">Guide de lecture</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="space-y-4 mt-6">
              <div>
                <ReactMarkdown className="text-sm text-muted-foreground">{story.story_summary}</ReactMarkdown>
              </div>
              {story.tags && story.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Thèmes abordés</h4>
                  <div className="flex flex-wrap gap-2">
                    {story.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs rounded-full bg-secondary/20 text-secondary-foreground transition-all hover:scale-105">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="guide" className="space-y-6 text-muted-foreground mt-6">
              <p className="text-sm italic">
                Lire une histoire est une façon douce et efficace d'aider un enfant à se relaxer et à s'endormir. 
                Voici des conseils simples pour guider votre lecture :
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Préparez l'environnement</h4>
                  <p className="text-sm">
                    Choisissez un endroit calme, tamisez les lumières et assurez-vous que l'enfant est confortablement installé.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Adoptez une posture détendue</h4>
                  <p className="text-sm">
                    Asseyez-vous confortablement, respirez calmement et commencez à lire avec une voix douce et posée. 
                    Votre propre calme aidera l'enfant à se détendre.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Lisez lentement et avec intention</h4>
                  <p className="text-sm">
                    Prenez votre temps pour chaque mot. Faites des pauses naturelles après les phrases, 
                    en laissant le temps aux images de se former dans l'esprit de l'enfant.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Utilisez le ton juste</h4>
                  <p className="text-sm">
                    Parlez avec une voix apaisante, ni trop monotone ni trop animée. 
                    L'objectif est de captiver doucement sans exciter.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Accentuez les mots-clés</h4>
                  <p className="text-sm">
                    Mettez légèrement l'accent sur des mots qui évoquent la détente, comme « calme », 
                    « douceur », « sommeil » ou « légèreté ». Cela renforce leur effet apaisant.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Encouragez l'imagination</h4>
                  <p className="text-sm">
                    Invitez l'enfant à visualiser ce que vous lisez, en utilisant des phrases comme 
                    « Imagine que… » ou « Ressens comme si… ». Cela stimule son esprit tout en le relaxant.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Soyez attentif à son rythme</h4>
                  <p className="text-sm">
                    Si l'enfant montre des signes de fatigue ou commence à s'endormir, 
                    ralentissez encore davantage votre lecture pour accompagner ce moment naturellement.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Terminez en douceur</h4>
                  <p className="text-sm">
                    À la fin du conte, baissez légèrement le volume de votre voix et concluez par une phrase 
                    simple et rassurante, comme un signal que le moment est terminé et qu'il peut s'endormir paisiblement.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Dialog pour les paramètres d'histoire */}
      <StorySettingsDialog story={story} open={showSettings} onOpenChange={setShowSettings} />
    </>;
};