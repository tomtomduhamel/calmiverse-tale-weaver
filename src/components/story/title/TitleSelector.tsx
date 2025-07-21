
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Sparkles } from "lucide-react";

interface GeneratedTitle {
  id: string;
  title: string;
  description?: string;
}

interface TitleSelectorProps {
  titles: GeneratedTitle[];
  onSelectTitle: (title: string) => void;
  isCreatingStory: boolean;
}

const TitleSelector: React.FC<TitleSelectorProps> = ({
  titles,
  onSelectTitle,
  isCreatingStory
}) => {
  if (titles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-primary-dark mb-2">
          Choisissez votre titre préféré
        </h3>
        <p className="text-sm text-muted-foreground">
          Sélectionnez le titre qui vous inspire le plus pour créer votre histoire personnalisée
        </p>
      </div>

      <div className="grid gap-3">
        {titles.map((titleObj, index) => (
          <Card 
            key={titleObj.id} 
            className="border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <Badge variant="secondary" className="text-xs">
                      Titre {index + 1}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1 group-hover:text-primary transition-colors">
                    {titleObj.title}
                  </h4>
                  {titleObj.description && (
                    <p className="text-sm text-muted-foreground">
                      {titleObj.description}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => onSelectTitle(titleObj.title)}
                  disabled={isCreatingStory}
                  className="ml-4 bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  {isCreatingStory ? (
                    <>
                      <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Choisir
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TitleSelector;
