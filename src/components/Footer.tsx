import React from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/lib/config';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-primary-soft/20 bg-background/60 backdrop-blur-xl mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{APP_CONFIG.APP_NAME}</h3>
            <p className="text-sm text-muted-foreground">
              {APP_CONFIG.APP_DESCRIPTION}
            </p>
            <p className="text-xs text-muted-foreground">
              v{APP_CONFIG.APP_VERSION_CLEAN}
              {APP_CONFIG.APP_BUILD_NUMBER && ` · build ${APP_CONFIG.APP_BUILD_NUMBER}`}
            </p>
          </div>

          {/* Legal links */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Légal</h4>
            <nav className="flex flex-col space-y-2">
              <Link 
                to="/terms" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Conditions d'utilisation
              </Link>
              <Link 
                to="/privacy-policy" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Politique de confidentialité
              </Link>
              <Link 
                to="/cookies" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Politique des cookies
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Support</h4>
            <nav className="flex flex-col space-y-2">
              <Link 
                to="/contact" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contactez-nous
              </Link>
              <Link
                to="/documentation"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Documentation
              </Link>
              <Link 
                to="/status" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              >
                <span>Statut du service</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </Link>
            </nav>
          </div>

          {/* Social & compliance */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Conformité</h4>
            <nav className="flex flex-col space-y-2">
              <Link 
                to="/privacy-policy"
                title="Consulter nos engagements RGPD"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
              >
                <div className="w-2 h-2 bg-accent rounded-full animate-glow-pulse group-hover:scale-125 transition-transform"></div>
                <span>RGPD Conforme</span>
              </Link>
              <Link 
                to="/privacy-policy"
                title="Protection et sécurité renforcée des mineurs"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
              >
                <div className="w-2 h-2 bg-accent rounded-full animate-glow-pulse group-hover:scale-125 transition-transform"></div>
                <span>Protection enfants</span>
              </Link>
              <Link 
                to="/privacy-policy"
                title="Chiffrement et isolation des données familiales"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
              >
                <div className="w-2 h-2 bg-accent rounded-full animate-glow-pulse group-hover:scale-125 transition-transform"></div>
                <span>Données sécurisées</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} {APP_CONFIG.COMPANY.NAME}. Tous droits réservés.
          </p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Hébergé en Europe</span>
            <span>•</span>
            <span>Chiffrement end-to-end</span>
            <span>•</span>
            <span>IA éthique</span>
          </div>
        </div>
      </div>
    </footer>
  );
};