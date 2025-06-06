
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Share2, Eye } from 'lucide-react';
import StoryReader from '@/components/StoryReader';
import type { Story } from '@/types/story';
import { useToast } from '@/hooks/use-toast';

const PublicStory = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReader, setShowReader] = useState(false);

  useEffect(() => {
    const fetchPublicStory = async () => {
      if (!token) {
        setError('Token manquant');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('sharing->publicAccess->token', token)
          .single();

        if (error || !data) {
          setError('Histoire introuvable ou lien expiré');
          return;
        }

        // Log de l'accès public
        await supabase
          .from('story_access_logs')
          .insert({
            story_id: data.id,
            access_data: {
              type: 'public_access',
              token,
              timestamp: new Date().toISOString(),
              user_agent: navigator.userAgent,
            }
          });

        // Formater l'histoire pour le type Story
        const formattedStory: Story = {
          id: data.id,
          title: data.title,
          preview: data.preview || '',
          objective: data.objective || '',
          childrenIds: data.childrenids || [],
          childrenNames: data.childrennames || [],
          createdAt: new Date(data.createdat),
          status: data.status || 'ready',
          content: data.content || '', // CORRECTION: utiliser 'content' au lieu de 'story_text'
          story_summary: data.summary || '',
          authorId: data.authorid,
          error: data.error,
          tags: [],
          updatedAt: data.updatedat ? new Date(data.updatedat) : new Date(),
        };

        setStory(formattedStory);
      } catch (err) {
        console.error('Erreur lors du chargement de l\'histoire publique:', err);
        setError('Erreur lors du chargement');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicStory();
  }, [token]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: story?.title,
          text: story?.preview,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Partage annulé');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié",
        description: "Le lien a été copié dans le presse-papiers",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement de l'histoire...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Histoire non trouvée</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {error || 'Cette histoire n\'est pas disponible.'}
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showReader) {
    return (
      <StoryReader 
        story={story} 
        onBack={() => setShowReader(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2">{story.title}</CardTitle>
                {story.childrenNames && story.childrenNames.length > 0 && (
                  <p className="text-muted-foreground">
                    Pour {story.childrenNames.join(', ')}
                  </p>
                )}
              </div>
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {story.preview && (
              <div>
                <h3 className="font-semibold mb-2">Aperçu</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {story.preview}
                </p>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                onClick={() => setShowReader(true)}
                className="px-8 py-6 text-lg"
              >
                <Eye className="mr-2 h-5 w-5" />
                Lire l'histoire
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Cette histoire a été partagée publiquement avec vous</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicStory;
