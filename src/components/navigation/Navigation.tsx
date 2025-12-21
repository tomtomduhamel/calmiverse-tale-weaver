import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Home, BookOpen, Users, Settings, LogOut, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useBackgroundStoryGeneration } from '@/hooks/stories/useBackgroundStoryGeneration';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { GlobalThemeToggle } from '@/components/ui/GlobalThemeToggle';
import { usePendingShares } from '@/hooks/stories/useStorySharing';
const Navigation = () => {
  const {
    user,
    logout
  } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { totalActiveCount } = useBackgroundStoryGeneration();
  const { pendingCount } = usePendingShares();
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
  const navItems = [{
    icon: Home,
    label: 'Accueil',
    path: '/'
  }, {
    icon: BookOpen,
    label: 'Histoires',
    path: '/library'
  }, {
    icon: Users,
    label: 'Enfants',
    path: '/children'
  }, {
    icon: Settings,
    label: 'Paramètres',
    path: '/settings'
  }];
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  return <nav className="bg-background border-b shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-xl text-primary">Calmi</Link>
          </div>
          
          {/* Navigation desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map(item => <Link key={item.path} to={item.path} className={`flex items-center px-3 py-2 rounded-md transition-colors ${isActive(item.path) ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}>
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
                {item.path === '/library' && (totalActiveCount > 0 || pendingCount > 0) && (
                  <Badge className="ml-2 bg-primary text-primary-foreground text-xs min-w-[1.2rem] h-5 px-1">
                    {totalActiveCount + pendingCount}
                  </Badge>
                )}
              </Link>)}
            
            {/* Badge notifications in-app */}
            <NotificationBell />

            {/* Toggle de thème global */}
            <GlobalThemeToggle />
          </div>
          
          <div className="hidden md:block">
            <Button variant="ghost" onClick={handleLogout} className="flex items-center text-muted-foreground hover:text-foreground hover:bg-accent/50">
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
            <SheetContent side="right" className="w-[250px] bg-background">
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map(item => <Link key={item.path} to={item.path} className={`flex items-center py-2 px-4 rounded-md ${isActive(item.path) ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`}>
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                    {item.path === '/library' && (totalActiveCount > 0 || pendingCount > 0) && (
                      <Badge className="ml-auto bg-primary text-primary-foreground text-xs min-w-[1.2rem] h-5 px-1">
                        {totalActiveCount + pendingCount}
                      </Badge>
                    )}
                  </Link>)}
                
                {/* Toggle de thème dans le menu mobile */}
                <div className="flex items-center justify-between py-2 px-4">
                  <span className="text-foreground">Thème</span>
                  <GlobalThemeToggle />
                </div>
                
                <Button variant="ghost" onClick={handleLogout} className="flex items-center justify-start w-full px-4 text-destructive hover:bg-muted">
                  <LogOut className="w-5 h-5 mr-3" />
                  Déconnexion
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>;
};
export default Navigation;