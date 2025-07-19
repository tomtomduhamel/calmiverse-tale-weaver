
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const NotFound = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <h1 className={`text-4xl ${isMobile ? '' : 'text-6xl'} font-bold text-primary mb-4 text-center`}>404</h1>
      <p className="text-xl mb-6 text-center">
        Oups ! Cette page semble s'être perdue dans un monde imaginaire.
      </p>
      <div className="max-w-md text-center mb-8 px-4">
        <p className="mb-4">
          Ne vous inquiétez pas, même les meilleures histoires ont parfois des pages égarées.
          Retournez à l'accueil pour continuer votre aventure avec Calmi.
        </p>
      </div>
      <Button asChild size={isMobile ? "default" : "lg"} className="bg-primary hover:bg-primary-dark text-white">
        <Link to="/" className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Retour à l'accueil
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;
