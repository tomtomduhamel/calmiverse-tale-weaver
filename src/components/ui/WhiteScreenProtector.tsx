import React, { useEffect, useState } from 'react';

interface WhiteScreenProtectorProps {
  children: React.ReactNode;
}

/**
 * Component to detect and prevent white screens by showing a loading indicator
 * if the app hasn't mounted within reasonable time
 */
export const WhiteScreenProtector: React.FC<WhiteScreenProtectorProps> = ({ children }) => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    console.log('📱 WhiteScreenProtector mounted');
    
    // Give the app some time to mount
    const mountTimer = setTimeout(() => {
      setIsAppReady(true);
      console.log('📱 WhiteScreenProtector: App is ready');
    }, 100);

    // PHASE 4 OPTIMISÉ: Timeout augmenté à 15s (sync avec auth 10s + marge)
    // AuthGuard gère maintenant la redirection auth, donc on peut être plus patient
    const fallbackTimer = setTimeout(() => {
      if (!isAppReady) {
        console.warn('⚠️ WhiteScreenProtector: App taking too long, showing fallback');
        setShowFallback(true);
      }
    }, 15000);

    return () => {
      clearTimeout(mountTimer);
      clearTimeout(fallbackTimer);
    };
  }, [isAppReady]);

  // Show fallback if app is taking too long
  if (showFallback && !isAppReady) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1FAEE',
        color: '#2c3e50',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #A8DADC',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <h2 style={{ marginBottom: '0.5rem' }}>✨ Calmi se prépare...</h2>
          <p style={{ color: '#666', fontSize: '0.875rem' }}>
            Nos petits lutins magiques organisent vos histoires 📚
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
};

export default WhiteScreenProtector;