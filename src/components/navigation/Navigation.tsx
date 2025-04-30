
import React from 'react';
import { Link } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Home, BookOpen, Users, Settings, LogOut } from 'lucide-react';

const Navigation = () => {
  const { user, signOut } = useSupabaseAuth();

  // Si l'utilisateur n'est pas connecté, ne pas afficher la navigation
  if (!user) {
    return null;
  }

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-xl">Calmiverse</Link>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center px-3 py-2 rounded-md hover:bg-primary-foreground/10 transition-colors">
                <Home className="w-4 h-4 mr-2" />
                Accueil
              </Link>
              <Link to="/" className="flex items-center px-3 py-2 rounded-md hover:bg-primary-foreground/10 transition-colors">
                <BookOpen className="w-4 h-4 mr-2" />
                Histoires
              </Link>
              <Link to="/" className="flex items-center px-3 py-2 rounded-md hover:bg-primary-foreground/10 transition-colors">
                <Users className="w-4 h-4 mr-2" />
                Profils
              </Link>
              <Link to="/settings" className="flex items-center px-3 py-2 rounded-md hover:bg-primary-foreground/10 transition-colors">
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </Link>
            </div>
          </div>
          
          <div className="hidden md:block">
            <Button variant="ghost" onClick={signOut} className="flex items-center">
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
          
          {/* Version mobile de la navigation (simple pour le moment) */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="sm">
              <span className="sr-only">Ouvrir le menu</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
