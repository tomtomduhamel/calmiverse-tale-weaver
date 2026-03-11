import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Star } from 'lucide-react';

const VipAccess = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    // Redirige vers /auth avec le flag VIP
    navigate('/auth?vip=true');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-4">
      
      {/* Étoiles décoratives d'arrière-plan */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
        <Sparkles className="absolute top-1/4 left-1/4 w-8 h-8 text-primary/30" />
        <Sparkles className="absolute top-1/3 right-1/4 w-12 h-12 text-pink-400/30" />
        <Star className="absolute bottom-1/3 left-1/3 w-6 h-6 text-purple-400/30 animate-pulse" />
        <Star className="absolute top-1/2 right-1/3 w-10 h-10 text-indigo-400/30" />
      </div>

      <Card className="w-full max-w-lg border-2 border-primary/20 shadow-xl relative z-10 bg-white/90 backdrop-blur-sm overflow-hidden">
        {/* Bande supérieure colorée */}
        <div className="h-2 w-full bg-gradient-to-r from-primary via-purple-500 to-pink-500"></div>
        
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6 ring-8 ring-primary/5">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            Accès VIP Exclusif
          </CardTitle>
          <CardDescription className="text-lg mt-2 text-gray-600">
            Bienvenue dans l'aventure des créateurs d'histoires !
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-6 pb-8">
          <p className="text-gray-600 leading-relaxed text-lg px-4">
            Vous avez été invité(e) à rejoindre les <strong className="text-primary font-semibold">Early Adopters</strong> de Calmi.
          </p>
          
          <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100/50 mx-4">
            <h3 className="font-semibold text-indigo-900 mb-2">🎁 Vos avantages exclusifs :</h3>
            <ul className="text-sm text-indigo-700/80 space-y-2 text-left inline-block">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Accès prioritaire à l'application</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Un abonnement premium offert</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Contact direct avec le créateur</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="pb-8 flex flex-col items-center">
          <Button 
            size="lg" 
            onClick={handleStart}
            className="w-full max-w-sm rounded-full text-lg h-14 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative"
          >
            <span className="relative z-10 flex items-center">
              Rejoindre l'aventure 🚀
            </span>
          </Button>
          <p className="text-xs text-muted-foreground mt-4 text-center max-w-xs">
            Aucun code d'invitation n'est requis. Cliquez simplement pour vous inscrire ou vous connecter.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VipAccess;
