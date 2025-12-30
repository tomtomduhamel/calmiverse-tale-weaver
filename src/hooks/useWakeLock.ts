import { useState, useRef, useCallback, useEffect } from 'react';

interface UseWakeLockReturn {
  isSupported: boolean;
  isActive: boolean;
  request: () => Promise<void>;
  release: () => Promise<void>;
}

/**
 * Hook pour gérer l'API Screen Wake Lock
 * Empêche l'écran de se mettre en veille pendant la lecture
 */
export const useWakeLock = (): UseWakeLockReturn => {
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  
  // Vérifier si l'API est supportée
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  const request = useCallback(async () => {
    if (!isSupported) {
      console.log('[WakeLock] API non supportée par ce navigateur');
      return;
    }

    try {
      // Libérer l'ancien wake lock s'il existe
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
      }

      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setIsActive(true);
      console.log('[WakeLock] Écran maintenu allumé');

      // Écouter la libération automatique (changement d'onglet, etc.)
      wakeLockRef.current.addEventListener('release', () => {
        console.log('[WakeLock] Wake lock libéré automatiquement');
        setIsActive(false);
      });
    } catch (err) {
      console.warn('[WakeLock] Impossible d\'activer le wake lock:', err);
      setIsActive(false);
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
        console.log('[WakeLock] Wake lock libéré manuellement');
      } catch (err) {
        console.warn('[WakeLock] Erreur lors de la libération:', err);
      }
    }
  }, []);

  // Réacquérir le wake lock quand la page redevient visible
  useEffect(() => {
    if (!isSupported) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLockRef.current) {
        console.log('[WakeLock] Page visible, réacquisition du wake lock');
        await request();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSupported, isActive, request]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);

  return {
    isSupported,
    isActive,
    request,
    release
  };
};
