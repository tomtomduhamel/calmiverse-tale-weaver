
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Home, BookOpen, Users, Settings, LogOut, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

const Navigation = () => {
  const { user, logout } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion', error);
    }
  };

  // Si l'utilisateur n'est pas connecté, ne pas afficher la navigation
  if (!user) {
    return null;
  }

  const navItems = [
    { icon: Home, label: 'Accueil', path: '/' },
    { icon: BookOpen, label: 'Histoires', path: '/app' },
    { icon: Users, label: 'Profils', path: '/profiles' },
    { icon: Settings, label: 'Paramètres', path: '/settings' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-primary text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-xl">Calmiverse</Link>
          </div>
          
          {/* Navigation desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  isActive(item.path) 
                    ? 'bg-primary-foreground/20 font-medium' 
                    : 'hover:bg-primary-foreground/10'
                }`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Link>
            ))}
          </div>
          
          <div className="hidden md:block">
            <Button 
              variant="ghost" 
              onClick={handleLogout} 
              className="flex items-center hover:bg-primary-foreground/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
          
          {/* Menu mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] bg-white dark:bg-background">
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center py-2 px-4 rounded-md ${
                      isActive(item.path)
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                ))}
                <Button 
                  variant="ghost" 
                  onClick={handleLogout} 
                  className="flex items-center justify-start w-full px-4 text-destructive hover:bg-muted"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Déconnexion
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
