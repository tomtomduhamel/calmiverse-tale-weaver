import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

const CheckoutCancelled: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-floating">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <XCircle className="h-9 w-9 text-muted-foreground" />
          </div>
          <h1 className="font-display italic text-2xl mb-2">Paiement annulé</h1>
          <p className="text-muted-foreground mb-6">
            Aucun montant n'a été débité. Vous pouvez réessayer quand vous le souhaitez.
          </p>
          <div className="flex flex-col gap-2">
            <Button size="lg" className="w-full" onClick={() => navigate('/pricing')}>
              Revoir les plans
            </Button>
            <Button variant="ghost" onClick={() => navigate('/contact')}>
              Besoin d'aide ? Contactez-nous
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutCancelled;
