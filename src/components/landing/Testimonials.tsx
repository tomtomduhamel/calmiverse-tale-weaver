import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sophie L.',
    location: 'Montréal',
    text: "Mon fils de 6 ans demande une histoire Calmi chaque soir. L'endormissement est devenu un moment doux qu'on attend tous les deux.",
  },
  {
    name: 'Marc G.',
    location: 'Québec',
    text: "Bluffant. Les histoires sont réellement adaptées à ma fille, à ses peurs et à ses passions. On a fait 30 histoires en un mois.",
  },
  {
    name: 'Élodie P.',
    location: 'Lyon',
    text: "Le mode audio est génial pour les longs trajets en voiture. Les enfants sont captivés du début à la fin.",
  },
];

export const Testimonials: React.FC = () => (
  <section className="container mx-auto px-4 py-12 max-w-5xl">
    <h2 className="font-display italic text-3xl sm:text-4xl text-center mb-10">
      Des familles qui ont retrouvé le calme
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {testimonials.map((t) => (
        <Card key={t.name} className="border-primary-soft/30 bg-card/70 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex gap-0.5 mb-3" aria-label="5 étoiles sur 5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-sm leading-relaxed mb-3">"{t.text}"</p>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{t.name}</span> · {t.location}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </section>
);

export default Testimonials;
