import { useEffect, useRef } from 'react';

/**
 * Hook pour verrouiller/déverrouiller le scroll du body de manière robuste
 * Gère les cas où plusieurs modals peuvent être ouverts simultanément
 */
export const useBodyScrollLock = (isActive: boolean) => {
  const originalStyle = useRef<string>('');
  const lockCount = useRef<number>(0);

  useEffect(() => {
    // Si pas encore initialisé, sauvegarder le style original
    if (originalStyle.current === '') {
      originalStyle.current = document.body.style.overflow || 'auto';
    }

    if (isActive) {
      // Incrémenter le compteur de verrous
      lockCount.current += 1;
      
      // Verrouiller le scroll seulement si c'est le premier verrou
      if (lockCount.current === 1) {
        // Sauvegarder la position de scroll actuelle
        const scrollY = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
      }
    } else {
      // Décrémenter le compteur de verrous
      if (lockCount.current > 0) {
        lockCount.current -= 1;
      }
    }

    // Fonction de nettoyage
    return () => {
      if (isActive && lockCount.current > 0) {
        lockCount.current -= 1;
        
        // Déverrouiller seulement si c'est le dernier verrou
        if (lockCount.current === 0) {
          // Récupérer la position de scroll sauvegardée
          const scrollY = document.body.style.top;
          
          // Restaurer les styles originaux
          document.body.style.overflow = originalStyle.current;
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          
          // Restaurer la position de scroll
          if (scrollY) {
            const y = parseInt(scrollY.replace('-', '').replace('px', '')) || 0;
            window.scrollTo(0, y);
          }
        }
      }
    };
  }, [isActive]);

  // Nettoyage au démontage du composant
  useEffect(() => {
    return () => {
      // Force la restauration du scroll si le composant est démonté
      if (lockCount.current > 0) {
        const scrollY = document.body.style.top;
        document.body.style.overflow = originalStyle.current;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        
        if (scrollY) {
          const y = parseInt(scrollY.replace('-', '').replace('px', '')) || 0;
          window.scrollTo(0, y);
        }
        
        lockCount.current = 0;
      }
    };
  }, []);
};