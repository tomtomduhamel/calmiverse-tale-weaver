import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Moon, Heart, Brain, Smile, Shield, Headphones, BookOpen, ArrowRight } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useSupabaseAuth();

  // Si l'utilisateur est déjà connecté, l'envoyer directement dans l'app
  useEffect(() => {
    if (!loading && user) {
      navigate('/app', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-display italic text-2xl text-foreground">Calmi</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/pricing"
            className="text-sm text-foreground/80 hover:text-foreground transition-colors hidden sm:inline"
          >
            Tarifs
          </Link>
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
            Connexion
          </Button>
          <Button size="sm" onClick={() => navigate('/auth?mode=signup')}>
            Commencer
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12 sm:py-20 text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          Essai gratuit 30 jours — sans carte de crédit
        </div>
        <h1 className="font-display italic text-4xl sm:text-6xl text-foreground tracking-tight mb-6 leading-tight">
          Des histoires sur-mesure pour apaiser vos enfants
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
          Calmi crée des contes personnalisés qui aident vos enfants à s'endormir, se concentrer,
          gérer leurs grandes émotions et s'amuser — en quelques secondes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" onClick={() => navigate('/auth?mode=signup')} className="gap-2">
            Créer ma première histoire gratuitement
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>
            Voir les tarifs
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Aucune carte requise · Désinscription en 1 clic
        </p>
      </section>

      {/* Bénéfices */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            { icon: Moon, title: "Mieux dormir", desc: "Des histoires douces pour l'endormissement." },
            { icon: Brain, title: "Se concentrer", desc: "Aide à canaliser l'attention." },
            { icon: Heart, title: "Apaiser les émotions", desc: "Pour gérer peur, colère, tristesse." },
            { icon: Smile, title: "S'amuser", desc: "Des aventures où votre enfant est le héros." },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-primary-soft/30 bg-card/70 backdrop-blur-sm">
              <CardContent className="p-5 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <h2 className="font-display italic text-3xl sm:text-4xl text-center mb-10">
          En trois étapes, c'est prêt
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { n: "1", title: "Créez le profil", desc: "Prénom, âge, centres d'intérêt." },
            { n: "2", title: "Choisissez l'intention", desc: "Dormir, se calmer, se concentrer, s'amuser." },
            { n: "3", title: "Lisez ou écoutez", desc: "Une histoire unique en moins de 60 secondes." },
          ].map(({ n, title, desc }) => (
            <div key={n} className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-3">
                {n}
              </div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Réassurance */}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: "100% sécurisé", desc: "Données chiffrées, conformité RGPD." },
            { icon: Headphones, title: "Version audio", desc: "Histoires racontées par une voix douce." },
            { icon: BookOpen, title: "Bibliothèque illimitée", desc: "Toutes vos histoires sauvegardées." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 rounded-lg bg-card/50">
              <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-sm">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="container mx-auto px-4 py-16 text-center max-w-2xl">
        <h2 className="font-display italic text-3xl sm:text-4xl mb-4">
          Prêt à créer votre première histoire ?
        </h2>
        <p className="text-muted-foreground mb-6">
          Essayez Calmi gratuitement pendant 30 jours. Sans carte de crédit.
        </p>
        <Button size="lg" onClick={() => navigate('/auth?mode=signup')} className="gap-2">
          Commencer maintenant
          <ArrowRight className="h-4 w-4" />
        </Button>
      </section>

      {/* Footer minimal */}
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground border-t border-border/50">
        <div className="flex flex-wrap justify-center gap-4 mb-2">
          <Link to="/pricing" className="hover:text-foreground">Tarifs</Link>
          <Link to="/privacy-policy" className="hover:text-foreground">Confidentialité</Link>
          <Link to="/terms" className="hover:text-foreground">CGU</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
        </div>
        <p>© {new Date().getFullYear()} Calmi · Fait avec ❤️ au Québec</p>
      </footer>
    </div>
  );
};

export default Landing;
