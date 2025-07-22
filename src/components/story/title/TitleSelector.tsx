
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";

interface GeneratedTitle {
  id: string;
  title: string;
  description?: string;
}

interface TitleSelectorProps {
  titles: GeneratedTitle[];
  onSelectTitle: (title: string) => void;
  onTitleSelected?: (title: GeneratedTitle) => void;
  isCreatingStory: boolean;
}

const TitleSelector: React.FC<TitleSelectorProps> = ({
  titles,
  onSelectTitle,
  isCreatingStory
}) => {
  if (titles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Aucun titre disponible. Veuillez réessayer la génération.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Choisissez votre titre préféré
          <Badge variant="secondary" className="ml-2">
            {titles.length} titre{titles.length > 1 ? 's' : ''} généré{titles.length > 1 ? 's' : ''}
          </Badge>
        </h3>
        <p className="text-sm text-muted-foreground">
          Sélectionnez le titre qui vous inspire le plus pour créer votre histoire personnalisée
        </p>
      </div>

      <div className="grid gap-4">
        {titles.map((title, index) => (
          <Card 
            key={title.id}
            className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      Titre {index + 1}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-primary-dark group-hover:text-primary transition-colors">
                    {title.title}
                  </h4>
                  {title.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {title.description}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => onSelectTitle(title.title)}
                  disabled={isCreatingStory}
                  className="bg-primary hover:bg-primary/90 text-white min-w-[120px]"
                >
                  {isCreatingStory ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Choisir
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {titles.length < 3 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Seulement {titles.length} titre{titles.length > 1 ? 's' : ''} généré{titles.length > 1 ? 's' : ''} au lieu de 3. 
            Vous pouvez utiliser {titles.length > 1 ? 'l\'un de ces titres' : 'ce titre'} ou recommencer pour en obtenir plus.
          </p>
        </div>
      )}
    </div>
  );
};

export default TitleSelector;
