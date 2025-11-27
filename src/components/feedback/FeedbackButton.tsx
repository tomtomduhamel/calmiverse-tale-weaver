import { useState } from 'react';
import { MessageSquarePlus, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      toast({
        title: "Note requise",
        description: "Merci de donner une note avant d'envoyer votre feedback.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour envoyer un feedback.",
          variant: "destructive",
        });
        return;
      }

      // Capture du contexte
      const deviceInfo = {
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        platform: navigator.platform,
        language: navigator.language,
      };

      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user.id,
          rating,
          feedback_text: feedbackText.trim() || null,
          page_url: window.location.pathname,
          device_info: deviceInfo,
        });

      if (error) throw error;

      toast({
        title: "Merci pour votre feedback ! 🎉",
        description: "Votre retour nous aide à améliorer Calmi.",
      });

      // Reset form
      setRating(null);
      setFeedbackText('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre feedback. Réessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <MessageSquarePlus className="h-5 w-5 mr-2" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Partagez votre expérience</DialogTitle>
          <DialogDescription>
            Votre feedback nous aide à améliorer Calmi pour vous et vos enfants.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Rating Stars */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Comment évaluez-vous votre expérience ?
            </label>
            <div className="flex gap-2 justify-center py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      rating && star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground hover:text-yellow-400'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating && (
              <p className="text-center text-sm text-muted-foreground">
                {rating === 5 && "Excellent ! 🎉"}
                {rating === 4 && "Très bien ! 😊"}
                {rating === 3 && "Bien 👍"}
                {rating === 2 && "Peut mieux faire 😐"}
                {rating === 1 && "Pas satisfait 😞"}
              </p>
            )}
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Dites-nous en plus (optionnel)
            </label>
            <Textarea
              placeholder="Qu'avez-vous aimé ? Que pourrions-nous améliorer ?"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !rating}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Envoyer mon feedback'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
