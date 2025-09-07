import React from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/lib/config';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{APP_CONFIG.APP_NAME}</h3>
            <p className="text-sm text-muted-foreground">
              {APP_CONFIG.APP_DESCRIPTION}
            </p>
            <p className="text-xs text-muted-foreground">
              Version {APP_CONFIG.APP_VERSION}
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
              <a 
                href={`mailto:${APP_CONFIG.COMPANY.EMAIL}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contactez-nous
              </a>
              <a 
                href={APP_CONFIG.SUPPORT.DOCUMENTATION}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Documentation
              </a>
              <a 
                href={APP_CONFIG.SUPPORT.STATUS}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Statut du service
              </a>
            </nav>
          </div>

          {/* Social & compliance */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Conformité</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">RGPD Conforme</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Protection enfants</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Données sécurisées</span>
              </div>
            </div>
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