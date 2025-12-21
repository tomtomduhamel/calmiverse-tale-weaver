import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Mail, 
  Clock, 
  ChevronRight, 
  Inbox,
  Loader2,
  Sparkles 
} from 'lucide-react';
import { usePendingShares } from '@/hooks/stories/useStorySharing';
import SharedStoryAcceptDialog from './SharedStoryAcceptDialog';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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

interface PendingSharesListProps {
  onShareAccepted?: () => void;
}

const PendingSharesList: React.FC<PendingSharesListProps> = ({ onShareAccepted }) => {
  const { pendingShares, isLoading, refetch } = usePendingShares();
  const [selectedShare, setSelectedShare] = useState<PendingShare | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleShareClick = (share: PendingShare) => {
    setSelectedShare(share);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedShare(null);
    }
  };

  const handleAccepted = () => {
    refetch();
    onShareAccepted?.();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pendingShares.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-1">Aucune invitation en attente</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Les histoires partagées par d'autres utilisateurs Calmi apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {pendingShares.map((share) => (
          <Card 
            key={share.share_id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleShareClick(share)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Sender avatar */}
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {share.sender_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">
                        {share.sender_name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {share.sender_email}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Nouvelle
                    </Badge>
                  </div>

                  <h4 className="font-semibold truncate">{share.story_title}</h4>
                  
                  {share.story_preview && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {share.story_preview}
                    </p>
                  )}

                  {share.story_children_names.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {share.story_children_names.map((name, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs"
                        >
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(share.created_at), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SharedStoryAcceptDialog
        share={selectedShare}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onAccepted={handleAccepted}
      />
    </>
  );
};

export default PendingSharesList;
