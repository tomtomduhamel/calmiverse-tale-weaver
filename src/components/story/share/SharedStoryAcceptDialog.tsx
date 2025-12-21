import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, User, Baby, Sparkles, Loader2, X } from 'lucide-react';
import { useSupabaseChildren } from '@/hooks/useSupabaseChildren';
import { usePendingShares } from '@/hooks/stories/useStorySharing';
import { cn } from '@/lib/utils';

interface PendingShare {
  share_id: string;
  story_id: string;
  story_title: string;
  story_preview: string | null;
  story_children_names: string[];
  sender_id: string;
  sender_name: string;
  sender_email: string;
  message: string | null;
  created_at: string;
  expires_at: string;
}

interface SharedStoryAcceptDialogProps {
  share: PendingShare | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccepted?: () => void;
}

const SharedStoryAcceptDialog: React.FC<SharedStoryAcceptDialogProps> = ({
  share,
  open,
  onOpenChange,
  onAccepted,
}) => {
  const { children, loading: childrenLoading } = useSupabaseChildren();
  const { acceptShare, rejectShare } = usePendingShares();
  const [characterMapping, setCharacterMapping] = useState<Record<string, string>>({});
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Reset mapping when share changes
  React.useEffect(() => {
    if (share) {
      setCharacterMapping({});
    }
  }, [share?.share_id]);

  // Get the original character names from the story
  const originalCharacters = useMemo(() => {
    return share?.story_children_names || [];
  }, [share?.story_children_names]);

  // Handle character mapping change
  const handleMappingChange = (originalName: string, childId: string) => {
    setCharacterMapping(prev => ({
      ...prev,
      [originalName]: childId === 'keep_original' ? '' : childId,
    }));
  };

  // Get selected child name for display
  const getSelectedChildName = (originalName: string): string | null => {
    const childId = characterMapping[originalName];
    if (!childId) return null;
    const child = children.find(c => c.id === childId);
    return child?.name || null;
  };

  // Build final mapping (original name -> new name)
  const buildFinalMapping = (): Record<string, string> => {
    const finalMapping: Record<string, string> = {};
    
    for (const originalName of originalCharacters) {
      const childId = characterMapping[originalName];
      if (childId) {
        const child = children.find(c => c.id === childId);
        if (child) {
          finalMapping[originalName] = child.name;
        }
      }
      // If no mapping, don't include in final mapping (keep original)
    }
    
    return finalMapping;
  };

  // Handle accept
  const handleAccept = async () => {
    if (!share) return;
    
    setIsAccepting(true);
    try {
      const finalMapping = buildFinalMapping();
      const result = await acceptShare(share.share_id, finalMapping);
      
      if (result.success) {
        onOpenChange(false);
        onAccepted?.();
      }
    } finally {
      setIsAccepting(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!share) return;
    
    setIsRejecting(true);
    try {
      const result = await rejectShare(share.share_id);
      
      if (result.success) {
        onOpenChange(false);
      }
    } finally {
      setIsRejecting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (!share) return null;

  const hasCharactersToMap = originalCharacters.length > 0;
  const hasChildren = children.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Histoire partagée
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{share.sender_name}</span> vous a partagé une histoire
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Story info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-lg">{share.story_title}</h3>
            {share.story_preview && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {share.story_preview}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Partagée le {formatDate(share.created_at)}</span>
              <span>•</span>
              <span>Expire le {formatDate(share.expires_at)}</span>
            </div>
          </div>

          {/* Message from sender */}
          {share.message && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-sm italic">"{share.message}"</p>
              <p className="text-xs text-muted-foreground mt-1">— {share.sender_name}</p>
            </div>
          )}

          <Separator />

          {/* Character mapping section */}
          {hasCharactersToMap && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Personnalisation des personnages</h4>
                <Badge variant="secondary" className="text-xs">
                  Optionnel
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Remplacez les personnages de l'histoire originale par vos propres enfants, 
                ou gardez les noms originaux.
              </p>

              {childrenLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {originalCharacters.map((originalName, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      {/* Original character */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Avatar className="h-8 w-8 bg-secondary/20">
                          <AvatarFallback className="text-xs bg-secondary/20 text-secondary-foreground">
                            {originalName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate">{originalName}</span>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

                      {/* Mapping select */}
                      <div className="flex-1 min-w-0">
                        <Select
                          value={characterMapping[originalName] || 'keep_original'}
                          onValueChange={(value) => handleMappingChange(originalName, value)}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="Garder le nom" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="keep_original">
                              <span className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                Garder "{originalName}"
                              </span>
                            </SelectItem>
                            
                            {hasChildren && (
                              <>
                                <Separator className="my-1" />
                                {children.map((child) => (
                                  <SelectItem key={child.id} value={child.id}>
                                    <span className="flex items-center gap-2">
                                      <Baby className="h-4 w-4 text-primary" />
                                      {child.name}
                                    </span>
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!hasChildren && !childrenLoading && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                  Vous n'avez pas encore créé de profils enfants. Les noms originaux seront conservés.
                </p>
              )}
            </div>
          )}

          {!hasCharactersToMap && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Cette histoire ne contient pas de personnages à personnaliser.
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isAccepting || isRejecting}
            className="w-full sm:w-auto"
          >
            {isRejecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Refuser
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isAccepting || isRejecting}
            className="w-full sm:w-auto"
          >
            {isAccepting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Accepter l'histoire
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SharedStoryAcceptDialog;
