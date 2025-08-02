
import JSZip from 'jszip';
import type { Story } from '@/types/story';
import { translateObjective, formatFrenchTitle } from '@/utils/objectiveTranslations';
import { calculateReadingTime } from '@/utils/readingTime';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface EpubGenerationResult {
  success: boolean;
  blob?: Blob;
  error?: string;
}

export const clientEpubGenerator = {
  /**
   * Génère un EPUB complet côté client avec JSZip
   */
  async generateEpub(story: Story): Promise<EpubGenerationResult> {
    console.log('📚 [ClientEpub] Début génération côté client pour:', story.title);
    
    try {
      // Validation des données
      if (!story.title || !story.content) {
        throw new Error("Données de l'histoire incomplètes");
      }

      const zip = new JSZip();
      
      // Structure EPUB standard
      await this.createMimeType(zip);
      await this.createMetaInf(zip);
      await this.createOebps(zip, story);
      
      // Générer le fichier ZIP/EPUB
      const blob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/epub+zip',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      console.log('✅ [ClientEpub] EPUB généré avec succès, taille:', Math.round(blob.size / 1024), 'KB');
      
      return {
        success: true,
        blob
      };
    } catch (error) {
      console.error('❌ [ClientEpub] Erreur génération:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  },

  /**
   * Crée le fichier mimetype (obligatoire EPUB)
   */
  async createMimeType(zip: JSZip): Promise<void> {
    zip.file('mimetype', 'application/epub+zip', {
      compression: 'STORE' // Pas de compression pour mimetype
    });
  },

  /**
   * Crée le dossier META-INF avec container.xml
   */
  async createMetaInf(zip: JSZip): Promise<void> {
    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    
    zip.folder('META-INF')?.file('container.xml', containerXml);
  },

  /**
   * Crée le contenu principal OEBPS
   */
  async createOebps(zip: JSZip, story: Story): Promise<void> {
    const oebps = zip.folder('OEBPS');
    if (!oebps) throw new Error('Impossible de créer le dossier OEBPS');

    // Fichier de configuration OPF
    await this.createContentOpf(oebps, story);
    
    // Table des matières NCX
    await this.createTocNcx(oebps, story);
    
    // Contenu HTML de l'histoire
    await this.createStoryHtml(oebps, story);
    
    // CSS pour le style
    await this.createStyleCss(oebps);
  },

  /**
   * Crée le fichier content.opf (métadonnées et structure)
   */
  async createContentOpf(oebps: JSZip, story: Story): Promise<void> {
    const bookId = `calmi-${Date.now()}`;
    const childrenText = story.childrenNames?.join(', ') || 'Enfant';
    const cleanTitle = formatFrenchTitle(this.cleanEpubTitle(story.title));
    
    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${this.escapeXml(cleanTitle)}</dc:title>
    <dc:creator>Calmi</dc:creator>
    <dc:identifier id="bookid">${bookId}</dc:identifier>
    <dc:language>fr</dc:language>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
    <dc:description>Histoire personnalisée pour ${this.escapeXml(childrenText)}</dc:description>
    <meta name="cover" content="cover"/>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="style" href="style.css" media-type="text/css"/>
    <item id="story" href="story.html" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="story"/>
  </spine>
</package>`;
    
    oebps.file('content.opf', contentOpf);
  },

  /**
   * Crée le fichier toc.ncx (navigation)
   */
  async createTocNcx(oebps: JSZip, story: Story): Promise<void> {
    const cleanTitle = formatFrenchTitle(this.cleanEpubTitle(story.title));
    const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx version="2005-1" xmlns="http://www.daisy.org/z3986/2005/ncx/">
  <head>
    <meta name="dtb:uid" content="calmi-${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${this.escapeXml(cleanTitle)}</text>
  </docTitle>
  <navMap>
    <navPoint id="story" playOrder="1">
      <navLabel>
        <text>${this.escapeXml(cleanTitle)}</text>
      </navLabel>
      <content src="story.html"/>
    </navPoint>
  </navMap>
</ncx>`;
    
    oebps.file('toc.ncx', tocNcx);
  },

  /**
   * Crée le fichier story.html avec le contenu
   */
  async createStoryHtml(oebps: JSZip, story: Story): Promise<void> {
    const childrenText = story.childrenNames?.join(', ') || 'votre enfant';
    const translatedObjective = translateObjective(story.objective);
    const cleanTitle = formatFrenchTitle(this.cleanEpubTitle(story.title));
    const readingTime = calculateReadingTime(story.content);
    const formattedDate = format(new Date(story.createdAt), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr });

    // Formater le contenu en paragraphes
    const formattedContent = story.content
      .split('\n')
      .filter(line => line.trim())
      .map(paragraph => `    <p>${this.escapeXml(paragraph.trim())}</p>`)
      .join('\n');

    const storyHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${this.escapeXml(cleanTitle)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
</head>
<body>
  <div class="title-page">
    <h1>${this.escapeXml(cleanTitle)}</h1>
    ${translatedObjective ? `<p class="objective">${this.escapeXml(translatedObjective)}</p>` : ''}
    <p class="children">Histoire personnalisée pour ${this.escapeXml(childrenText)}</p>
    <p class="reading-info">${readingTime} • ${formattedDate}</p>
    <p class="author">Créé par Calmi</p>
  </div>
  
  <div class="story-content">
${formattedContent}
  </div>
</body>
</html>`;
    
    oebps.file('story.html', storyHtml);
  },

  /**
   * Crée le fichier style.css
   */
  async createStyleCss(oebps: JSZip): Promise<void> {
    const styleCss = `
body {
  font-family: Georgia, serif;
  line-height: 1.6;
  margin: 1em;
  color: #333;
}

.title-page {
  text-align: center;
  margin-bottom: 3em;
  page-break-after: always;
}

.title-page h1 {
  font-size: 2em;
  margin-bottom: 0.5em;
  color: #2c3e50;
}

.title-page .objective {
  font-style: italic;
  color: #7f8c8d;
  margin: 1em 0;
}

.title-page .children {
  font-weight: bold;
  color: #e74c3c;
  margin: 1em 0;
}

.title-page .reading-info {
  color: #7f8c8d;
  font-size: 0.9em;
  margin: 0.5em 0;
}

.title-page .author {
  color: #95a5a6;
  font-size: 0.9em;
  margin-top: 2em;
}

.story-content p {
  margin-bottom: 1em;
  text-align: justify;
  text-indent: 1.5em;
}

.story-content p:first-child {
  text-indent: 0;
}

h2 {
  color: #2c3e50;
  margin-top: 2em;
  margin-bottom: 1em;
}
`;
    
    oebps.file('style.css', styleCss);
  },

  /**
   * Nettoie le titre pour l'EPUB (pas de timestamp, caractères spéciaux propres)
   */
  cleanEpubTitle(title: string): string {
    if (!title) return 'Histoire';
    
    return title
      .replace(/^\d+-/, '') // Supprime timestamp au début
      .replace(/[^\p{L}\p{N}\s\-''.!?]/gu, '') // Garde lettres, chiffres, espaces et ponctuation de base
      .replace(/\s+/g, ' ') // Normalise les espaces
      .trim();
  },

  /**
   * Échappe les caractères XML/HTML
   */
  escapeXml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};
