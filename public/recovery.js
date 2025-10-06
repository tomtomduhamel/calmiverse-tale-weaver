// Calmi - Recovery Script
// Script autonome pour diagnostiquer et réparer les problèmes PWA

(function() {
  'use strict';
  
  // Afficher les infos de build
  function showBuildInfo() {
    const buildIdEl = document.getElementById('build-id');
    const userAgentEl = document.getElementById('user-agent');
    const navTypeEl = document.getElementById('nav-type');
    
    if (buildIdEl) {
      const buildId = document.getElementById('calmi-boot-stamp')?.textContent || 
                      localStorage.getItem('calmi_build_id') || 
                      'Unknown';
      buildIdEl.textContent = buildId;
    }
    
    if (userAgentEl) {
      userAgentEl.textContent = navigator.userAgent;
    }
    
    if (navTypeEl && performance.navigation) {
      const types = ['navigate', 'reload', 'back_forward', 'prerender'];
      navTypeEl.textContent = types[performance.navigation.type] || 'unknown';
    }
  }
  
  // Lister les Service Workers enregistrés
  async function listServiceWorkers() {
    const container = document.getElementById('sw-list');
    
    if (!('serviceWorker' in navigator)) {
      container.innerHTML = '<div class="sw-item">❌ Service Worker non supporté par ce navigateur</div>';
      return;
    }
    
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length === 0) {
        container.innerHTML = '<div class="no-sw">✅ Aucun Service Worker enregistré (état sain)</div>';
        return;
      }
      
      container.innerHTML = registrations.map((reg, idx) => {
        const scope = reg.scope;
        const state = reg.active ? 'active' : reg.installing ? 'installing' : reg.waiting ? 'waiting' : 'unknown';
        return `<div class="sw-item"><strong>#${idx + 1}:</strong> ${scope} (${state})</div>`;
      }).join('');
      
    } catch (error) {
      container.innerHTML = `<div class="sw-item">⚠️ Erreur lors de la lecture: ${error.message}</div>`;
    }
  }
  
  // Afficher un message de statut
  function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    if (!statusEl) return;
    
    statusEl.className = `status show ${type}`;
    statusEl.textContent = message;
    
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        statusEl.classList.remove('show');
      }, 5000);
    }
  }
  
  // Nettoyer TOUT et redémarrer
  async function unregisterAllAndRestart() {
    const button = document.getElementById('unregister-all');
    if (button) button.disabled = true;
    
    showStatus('🔄 Nettoyage en cours...', 'info');
    
    try {
      let swCount = 0;
      let cacheCount = 0;
      
      // 1. Désinstaller tous les Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        swCount = registrations.length;
        
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log(`[Recovery] ${swCount} Service Workers désinstallés`);
      }
      
      // 2. Supprimer tous les caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        cacheCount = cacheNames.length;
        
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log(`[Recovery] ${cacheCount} caches supprimés`);
      }
      
      // 3. Nettoyer localStorage des flags de débogage
      try {
        localStorage.removeItem('calmi_early_errors');
        localStorage.removeItem('calmi_safe_mode');
      } catch (e) {}
      
      showStatus(`✅ Nettoyage réussi: ${swCount} SW + ${cacheCount} caches supprimés. Redémarrage...`, 'success');
      
      // 4. Redémarrer après 1 seconde
      setTimeout(() => {
        window.location.href = '/?recovery-done=1';
      }, 1000);
      
    } catch (error) {
      console.error('[Recovery] Erreur:', error);
      showStatus(`❌ Erreur: ${error.message}`, 'error');
      if (button) button.disabled = false;
    }
  }
  
  // Event listeners
  document.addEventListener('DOMContentLoaded', function() {
    showBuildInfo();
    listServiceWorkers();
    
    const unregisterBtn = document.getElementById('unregister-all');
    if (unregisterBtn) {
      unregisterBtn.addEventListener('click', unregisterAllAndRestart);
    }
    
    const refreshBtn = document.getElementById('refresh-list');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() {
        showStatus('🔄 Actualisation...', 'info');
        listServiceWorkers();
        setTimeout(() => {
          showStatus('', 'info');
        }, 1000);
      });
    }
  });
  
  console.log('[Calmi Recovery] Script chargé et prêt');
})();