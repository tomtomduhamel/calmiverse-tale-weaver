/**
 * Asset Optimizer - Phase 3 Commercial Publication
 * Optimisation des ressources et gestion CDN
 */

interface OptimizationConfig {
  enableWebP: boolean;
  enableLazyLoading: boolean;
  enablePrefetch: boolean;
  compressionLevel: number;
  maxImageSize: number;
}

interface AssetStats {
  totalAssets: number;
  optimizedAssets: number;
  totalSize: number;
  savedBytes: number;
  loadTime: number;
}

class AssetOptimizer {
  private config: OptimizationConfig = {
    enableWebP: true,
    enableLazyLoading: true,
    enablePrefetch: true,
    compressionLevel: 0.8,
    maxImageSize: 1920
  };

  private stats: AssetStats = {
    totalAssets: 0,
    optimizedAssets: 0,
    totalSize: 0,
    savedBytes: 0,
    loadTime: 0
  };

  private observer: IntersectionObserver | null = null;

  constructor(config?: Partial<OptimizationConfig>) {
    this.config = { ...this.config, ...config };
    this.initializeLazyLoading();
  }

  /**
   * Optimise une image pour la performance
   */
  async optimizeImage(
    file: File | Blob, 
    maxWidth?: number, 
    quality?: number
  ): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const targetWidth = Math.min(
          maxWidth || this.config.maxImageSize, 
          img.width
        );
        const targetHeight = (img.height * targetWidth) / img.width;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              this.stats.optimizedAssets++;
              this.stats.savedBytes += file.size - blob.size;
              resolve(blob);
            } else {
              reject(new Error('Échec de l\'optimisation de l\'image'));
            }
          },
          'image/jpeg',
          quality || this.config.compressionLevel
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Convertit une image en WebP si supporté
   */
  async convertToWebP(file: File): Promise<Blob> {
    if (!this.supportsWebP()) {
      return file;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Conversion WebP échouée'));
            }
          },
          'image/webp',
          this.config.compressionLevel
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Vérifie le support WebP
   */
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Initialise le lazy loading des images
   */
  private initializeLazyLoading(): void {
    if (!this.config.enableLazyLoading || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer?.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );
  }

  /**
   * Ajoute une image au lazy loading
   */
  observeImage(img: HTMLImageElement): void {
    if (this.observer && img.dataset.src) {
      this.observer.observe(img);
    }
  }

  /**
   * Charge une image
   */
  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
      img.classList.add('loaded');
    }
  }

  /**
   * Précharge des ressources critiques
   */
  preloadCriticalAssets(urls: string[]): void {
    if (!this.config.enablePrefetch) return;

    urls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      
      // Détermine le type de ressource
      if (url.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
        link.as = 'image';
      } else if (url.match(/\.(woff|woff2|ttf|otf)$/i)) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      } else if (url.match(/\.(css)$/i)) {
        link.as = 'style';
      } else if (url.match(/\.(js)$/i)) {
        link.as = 'script';
      }
      
      document.head.appendChild(link);
    });
  }

  /**
   * Génère un placeholder pour les images
   */
  generatePlaceholder(width: number, height: number, color = '#f0f0f0'): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
    
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      
      // Ajoute un effet de dégradé
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    return canvas.toDataURL('image/png');
  }

  /**
   * Optimise les ressources pour le CDN
   */
  getCDNUrl(path: string, transformations?: string[]): string {
    const baseUrl = 'https://ioeihnoxvtpxtqhxklpw.supabase.co/storage/v1/object/public';
    
    if (!transformations || transformations.length === 0) {
      return `${baseUrl}/${path}`;
    }
    
    const params = transformations.join(',');
    return `${baseUrl}/${path}?transform=${encodeURIComponent(params)}`;
  }

  /**
   * Génère différentes tailles d'images responsives
   */
  generateResponsiveImages(originalUrl: string): Record<string, string> {
    const sizes = {
      thumbnail: 'w_150,h_150,c_fill',
      small: 'w_300,h_200,c_fill',
      medium: 'w_600,h_400,c_fill',
      large: 'w_1200,h_800,c_fill',
      xlarge: 'w_1920,h_1080,c_fill'
    };

    const responsiveImages: Record<string, string> = {};
    
    for (const [size, transform] of Object.entries(sizes)) {
      responsiveImages[size] = this.getCDNUrl(originalUrl, [transform]);
    }
    
    return responsiveImages;
  }

  /**
   * Compresse et upload un fichier
   */
  async compressAndUpload(
    file: File, 
    uploadFn: (file: Blob, filename: string) => Promise<string>
  ): Promise<string> {
    try {
      let optimizedFile: Blob = file;
      
      // Optimise si c'est une image
      if (file.type.startsWith('image/')) {
        if (this.config.enableWebP) {
          optimizedFile = await this.convertToWebP(file);
        } else {
          optimizedFile = await this.optimizeImage(file);
        }
      }
      
      const result = await uploadFn(optimizedFile, file.name);
      this.stats.totalAssets++;
      
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'optimisation et upload:', error);
      throw error;
    }
  }

  /**
   * Retourne les statistiques d'optimisation
   */
  getStats(): AssetStats {
    return { ...this.stats };
  }

  /**
   * Remet à zéro les statistiques
   */
  resetStats(): void {
    this.stats = {
      totalAssets: 0,
      optimizedAssets: 0,
      totalSize: 0,
      savedBytes: 0,
      loadTime: 0
    };
  }

  /**
   * Mesure le temps de chargement d'une ressource
   */
  async measureLoadTime(url: string): Promise<number> {
    const startTime = performance.now();
    
    try {
      await fetch(url);
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      this.stats.loadTime = (this.stats.loadTime + loadTime) / 2; // Moyenne mobile
      
      return loadTime;
    } catch (error) {
      console.error('Erreur lors de la mesure du temps de chargement:', error);
      return -1;
    }
  }

  /**
   * Nettoie les ressources
   */
  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Instance globale de l'optimiseur d'assets
export const assetOptimizer = new AssetOptimizer({
  enableWebP: true,
  enableLazyLoading: true,
  enablePrefetch: true,
  compressionLevel: 0.85,
  maxImageSize: 1920
});