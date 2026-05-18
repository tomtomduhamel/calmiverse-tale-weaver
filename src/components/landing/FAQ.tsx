import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const items = [
  {
    q: "Combien coûte Calmi ?",
    a: "Vous bénéficiez de 30 jours gratuits, sans carte de crédit. Ensuite, les forfaits commencent à 2$ CAD par mois. Vous pouvez annuler à tout moment, en un clic.",
  },
  {
    q: "À partir de quel âge ?",
    a: "Calmi est conçu pour les enfants de 2 à 12 ans. Vous choisissez le prénom, l'âge et les centres d'intérêt pour adapter chaque histoire.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Oui. Toutes les données sont chiffrées et stockées dans des infrastructures conformes RGPD. Nous ne revendons jamais vos informations.",
  },
  {
    q: "Comment fonctionne l'audio ?",
    a: "Certains forfaits incluent la version audio narrée par une voix douce. Idéale pour la voiture, le coucher ou les moments calmes.",
  },
  {
    q: "Puis-je annuler facilement ?",
    a: "Oui, en un clic depuis votre espace abonnement. Pas d'engagement, pas de question.",
  },
];

export const FAQ: React.FC = () => (
  <section className="container mx-auto px-4 py-12 max-w-3xl">
    <h2 className="font-display italic text-3xl sm:text-4xl text-center mb-8">
      Vos questions, nos réponses
    </h2>
    <Accordion type="single" collapsible className="w-full">
      {items.map((item, i) => (
        <AccordionItem key={i} value={`item-${i}`}>
          <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </section>
);

export default FAQ;
