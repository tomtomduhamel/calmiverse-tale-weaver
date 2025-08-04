
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`📚 [upload-epub-${requestId}] Nouvelle requête optimisée`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.error(`❌ [upload-epub-${requestId}] Méthode non autorisée:`, req.method);
    return new Response(
      JSON.stringify({ error: 'Méthode non autorisée' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log(`🔍 [upload-epub-${requestId}] Parsing request body...`);
    const startTime = Date.now();
    
    const { content, filename, optimized = false, imageBlob = null } = await req.json();
    
    if (!content || !filename) {
      throw new Error('Contenu ou nom de fichier manquant');
    }

    const parseTime = Date.now() - startTime;
    console.log(`📋 [upload-epub-${requestId}] Request parsed in ${parseTime}ms, optimized: ${optimized}`);

    // Validation rapide du contenu
    if (content.length < 10) {
      throw new Error('Contenu trop court');
    }

    if (content.length > 1024 * 1024) { // 1MB max
      console.warn(`⚠️ [upload-epub-${requestId}] Contenu volumineux: ${content.length} chars`);
    }

    // Vérification/création bucket optimisée
    console.log(`📦 [upload-epub-${requestId}] Vérification bucket...`);
    
    // Générer le fichier EPUB avec optimisations
    const epubStartTime = Date.now();
    const epubBuffer = createOptimizedEpubFile(content, filename, imageBlob);
    const epubTime = Date.now() - epubStartTime;
    
    console.log(`📖 [upload-epub-${requestId}] EPUB généré en ${epubTime}ms, taille: ${epubBuffer.byteLength} bytes`);
    
    // CORRECTION DÉFINITIVE: Séparer nom de stockage et nom affiché
    const timestamp = Date.now();
    
    // Nom propre pour les métadonnées EPUB (avec espaces)
    const cleanDisplayTitle = filename
      .replace(/^\d+_/, '') // Supprimer les chiffres au début
      .replace(/_/g, ' ')   // Remplacer underscores par espaces
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Supprimer caractères spéciaux
      .replace(/\s+/g, ' ') // Nettoyer espaces multiples
      .trim();
    
    // Nom de fichier pour l'utilisateur (propre, avec espaces)
    const epubFilename = `${cleanDisplayTitle}.epub`;
    
    // Chemin de stockage interne (avec timestamp + underscores pour éviter conflits)
    const storagePath = `epubs/${timestamp}_${cleanDisplayTitle.replace(/\s+/g, '_')}.epub`;

    // Upload optimisé avec retry automatique
    console.log(`📤 [upload-epub-${requestId}] Upload vers: ${storagePath}`);
    
    const uploadStartTime = Date.now();
    let uploadSuccess = false;
    let uploadData = null;
    let uploadError = null;

    // Stratégie d'upload avec fallback
    const uploadStrategies = [
      // Stratégie 1: Upload normal
      () => supabase.storage
        .from('story-files')
        .upload(storagePath, epubBuffer, {
          contentType: 'application/epub+zip',
          cacheControl: '3600',
          upsert: true
        }),
      
      // Stratégie 2: Nouveau nom avec UUID
      () => {
        const fallbackPath = `epubs/${cleanDisplayTitle.replace(/\s+/g, '_')}_${timestamp}_${crypto.randomUUID().slice(0, 8)}.epub`;
        return supabase.storage
          .from('story-files')
          .upload(fallbackPath, epubBuffer, {
            contentType: 'application/epub+zip',
            cacheControl: '3600',
            upsert: true
          }).then(result => ({ ...result, path: fallbackPath }));
      }
    ];

    for (let i = 0; i < uploadStrategies.length && !uploadSuccess; i++) {
      try {
        console.log(`🔄 [upload-epub-${requestId}] Tentative upload ${i + 1}/${uploadStrategies.length}`);
        
        const result = await uploadStrategies[i]();
        
        if (!result.error) {
          uploadData = result.data;
          uploadSuccess = true;
          
          // Mise à jour du chemin si fallback
          if (result.path) {
            storagePath = result.path;
          }
          
          console.log(`✅ [upload-epub-${requestId}] Upload réussi en tentative ${i + 1}`);
        } else {
          uploadError = result.error;
          console.warn(`⚠️ [upload-epub-${requestId}] Tentative ${i + 1} échouée:`, result.error.message);
        }
      } catch (strategyError) {
        uploadError = strategyError;
        console.warn(`⚠️ [upload-epub-${requestId}] Exception tentative ${i + 1}:`, strategyError);
      }
    }

    if (!uploadSuccess) {
      throw new Error(`Échec upload après ${uploadStrategies.length} tentatives: ${uploadError?.message || 'Erreur inconnue'}`);
    }

    const uploadTime = Date.now() - uploadStartTime;
    console.log(`📤 [upload-epub-${requestId}] Upload terminé en ${uploadTime}ms`);

    // Générer l'URL publique
    const { data: urlData } = supabase.storage
      .from('story-files')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;
    
    if (!publicUrl) {
      throw new Error('Impossible de générer l\'URL publique');
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ [upload-epub-${requestId}] Processus complet en ${totalTime}ms - URL: ${publicUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        filename: epubFilename,
        size: epubBuffer.byteLength,
        path: storagePath,
        timing: {
          parse: parseTime,
          epub: epubTime,
          upload: uploadTime,
          total: totalTime
        },
        optimized
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error(`❌ [upload-epub-${requestId}] Erreur:`, {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });

    return new Response(
      JSON.stringify({
        error: true,
        message: error.message,
        requestId,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Crée un fichier EPUB optimisé avec structure complète pour Kindle
 */
function createOptimizedEpubFile(htmlContent: string, title: string, imageBlob?: string | null): Uint8Array {
  console.log('[createOptimizedEpubFile] Début création EPUB:', {
    title,
    hasContent: !!htmlContent,
    hasImage: !!(imageBlob && imageBlob.length > 0),
    imageBlobLength: imageBlob?.length || 0
  });

  const files: { [key: string]: Uint8Array } = {};
  
  // Nettoyer le titre pour l'affichage dans les métadonnées
  const cleanTitle = formatFrenchTitle(title
    .replace(/^\d+_/, '') // Supprimer les chiffres au début
    .replace(/_/g, ' ')   // Remplacer les underscores par des espaces
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Supprimer caractères spéciaux
    .replace(/\s+/g, ' ') // Nettoyer les espaces multiples
    .trim());
  
  // 1. mimetype (non compressé, obligatoire pour EPUB)
  files['mimetype'] = new TextEncoder().encode('application/epub+zip');
  
  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  files['META-INF/container.xml'] = new TextEncoder().encode(containerXml);
  
  // Détection du type d'image et extension appropriée
  const hasImage = imageBlob && imageBlob.length > 0;
  let imageExtension = 'jpeg';
  let imageMimeType = 'image/jpeg';
  
  if (hasImage && imageBlob) {
    try {
      console.log('[createOptimizedEpubFile] Traitement image, taille base64:', imageBlob.length);
      
      // Décodage pour analyser les premiers bytes
      const imageData = Uint8Array.from(atob(imageBlob), c => c.charCodeAt(0));
      
      // Vérification des signatures de fichiers
      if (imageData.length >= 8) {
        // PNG signature: 89 50 4E 47 0D 0A 1A 0A
        if (imageData[0] === 0x89 && imageData[1] === 0x50 && imageData[2] === 0x4E && imageData[3] === 0x47) {
          imageExtension = 'png';
          imageMimeType = 'image/png';
          console.log('[createOptimizedEpubFile] Image détectée comme PNG');
        }
        // JPEG signature: FF D8 FF
        else if (imageData[0] === 0xFF && imageData[1] === 0xD8 && imageData[2] === 0xFF) {
          imageExtension = 'jpeg';
          imageMimeType = 'image/jpeg';
          console.log('[createOptimizedEpubFile] Image détectée comme JPEG');
        } else {
          console.warn('[createOptimizedEpubFile] Format d\'image non reconnu, utilisation JPEG par défaut');
        }
      }
      
      // Ajouter l'image avec la bonne extension
      files[`OEBPS/cover.${imageExtension}`] = imageData;
      console.log('[createOptimizedEpubFile] Image ajoutée:', `cover.${imageExtension}`, 'taille:', imageData.length);
    } catch (error) {
      console.error('[createOptimizedEpubFile] Erreur lors du traitement de l\'image:', error);
    }
  }
  
  // 3. OEBPS/content.opf avec métadonnées optimisées pour Kindle
  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${escapeXml(cleanTitle)}</dc:title>
    <dc:creator opf:role="aut">Calmiverse</dc:creator>
    <dc:identifier id="bookid">calmiverse-${Date.now()}</dc:identifier>
    <dc:language>fr</dc:language>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
    <dc:publisher>Calmiverse</dc:publisher>
    <dc:subject>Histoire pour enfants</dc:subject>
    <dc:description>Histoire personnalisée générée par Calmiverse</dc:description>
    ${hasImage ? `<meta name="cover" content="cover-image"/>` : ''}
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    ${hasImage ? `<item id="cover-page" href="cover.xhtml" media-type="application/xhtml+xml"/>` : ''}
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
    ${hasImage ? `<item id="cover-image" href="cover.${imageExtension}" media-type="${imageMimeType}"/>` : ''}
  </manifest>
  <spine toc="ncx">
    ${hasImage ? `<itemref idref="cover-page"/>` : ''}
    <itemref idref="content"/>
  </spine>
  <guide>
    ${hasImage ? `<reference type="cover" title="Couverture" href="cover.xhtml"/>` : ''}
    <reference type="text" title="Histoire" href="content.xhtml"/>
  </guide>
</package>`;
  files['OEBPS/content.opf'] = new TextEncoder().encode(contentOpf);
  
  // 4. OEBPS/toc.ncx
  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="calmiverse-${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(cleanTitle)}</text>
  </docTitle>
  <navMap>
    ${hasImage ? `
    <navPoint id="navpoint-cover" playOrder="1">
      <navLabel>
        <text>Couverture</text>
      </navLabel>
      <content src="cover.xhtml"/>
    </navPoint>` : ''}
    <navPoint id="navpoint-content" playOrder="${hasImage ? '2' : '1'}">
      <navLabel>
        <text>${escapeXml(cleanTitle)}</text>
      </navLabel>
      <content src="content.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;
  files['OEBPS/toc.ncx'] = new TextEncoder().encode(tocNcx);
  
  // 5. Page de couverture séparée pour Kindle (si image présente)
  if (hasImage) {
    const coverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Couverture</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      text-align: center;
    }
    .cover {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cover img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="cover">
    <img src="cover.${imageExtension}" alt="Couverture de ${escapeXml(cleanTitle)}"/>
  </div>
</body>
</html>`;
    files['OEBPS/cover.xhtml'] = new TextEncoder().encode(coverXhtml);
    console.log('[createOptimizedEpubFile] Page de couverture créée');
  }
  
  // 6. OEBPS/content.xhtml - contenu principal optimisé pour Kindle
  const contentXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(cleanTitle)}</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <style type="text/css">
    body { 
      font-family: "Bookerly", "Times New Roman", serif; 
      line-height: 1.6; 
      margin: 1em; 
      color: #1a1a1a;
    }
    h1 { 
      color: #2D3748; 
      text-align: center; 
      margin: 1em 0 2em 0; 
      font-size: 1.8em;
      page-break-before: always;
    }
    h2 {
      color: #4A5568;
      margin: 1.5em 0 1em 0;
      font-size: 1.3em;
    }
    p { 
      margin-bottom: 1em; 
      text-align: justify; 
      text-indent: 1.5em;
    }
    .story-meta {
      text-align: center;
      font-style: italic;
      color: #666;
      margin-bottom: 2em;
      border-bottom: 1px solid #ddd;
      padding-bottom: 1em;
    }
    @media amzn-mobi {
      body { margin: 0; }
    }
    @media amzn-kf8 {
      body { font-family: "Bookerly", serif; }
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
  files['OEBPS/content.xhtml'] = new TextEncoder().encode(contentXhtml);
  
  console.log('[createOptimizedEpubFile] EPUB créé avec', Object.keys(files).length, 'fichiers');
  return createOptimizedZipFile(files);
}

function createOptimizedZipFile(files: { [key: string]: Uint8Array }): Uint8Array {
  const zipData: number[] = [];
  const centralDirectory: number[] = [];
  let offset = 0;

  for (const [filename, content] of Object.entries(files)) {
    const filenameBytes = new TextEncoder().encode(filename);
    const crc32 = calculateCRC32(content);
    
    // En-tête local optimisé
    const localHeader = [
      0x50, 0x4b, 0x03, 0x04, // Signature
      0x14, 0x00,             // Version
      0x00, 0x00,             // Flags
      0x00, 0x00,             // Méthode store (pas de compression)
      0x00, 0x00, 0x00, 0x00, // Timestamp
      ...numberToBytes(crc32, 4),
      ...numberToBytes(content.length, 4),
      ...numberToBytes(content.length, 4),
      ...numberToBytes(filenameBytes.length, 2),
      0x00, 0x00
    ];
    
    // Entrée répertoire central
    const centralEntry = [
      0x50, 0x4b, 0x01, 0x02,
      0x14, 0x00, 0x14, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      ...numberToBytes(crc32, 4),
      ...numberToBytes(content.length, 4),
      ...numberToBytes(content.length, 4),
      ...numberToBytes(filenameBytes.length, 2),
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      ...numberToBytes(offset, 4)
    ];
    
    zipData.push(...localHeader, ...filenameBytes, ...content);
    centralDirectory.push(...centralEntry, ...filenameBytes);
    
    offset += localHeader.length + filenameBytes.length + content.length;
  }

  // Record de fin
  const endRecord = [
    0x50, 0x4b, 0x05, 0x06,
    0x00, 0x00, 0x00, 0x00,
    ...numberToBytes(Object.keys(files).length, 2),
    ...numberToBytes(Object.keys(files).length, 2),
    ...numberToBytes(centralDirectory.length, 4),
    ...numberToBytes(offset, 4),
    0x00, 0x00
  ];

  return new Uint8Array([...zipData, ...centralDirectory, ...endRecord]);
}

function numberToBytes(num: number, bytes: number): number[] {
  const result = [];
  for (let i = 0; i < bytes; i++) {
    result.push(num & 0xff);
    num >>= 8;
  }
  return result;
}

function calculateCRC32(data: Uint8Array): number {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Formats a title according to French capitalization rules
 */
function formatFrenchTitle(title: string): string {
  if (!title) return '';
  
  const words = title.toLowerCase().split(' ');
  
  // List of articles, prepositions and conjunctions that should stay lowercase
  const lowercaseWords = [
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'à', 'au', 'aux',
    'dans', 'sur', 'avec', 'pour', 'par', 'sans', 'sous', 'vers', 'chez', 'entre',
    'jusqu', 'depuis', 'pendant', 'avant', 'après', 'mais', 'car', 'donc', 'or', 'ni'
  ];
  
  return words.map((word, index) => {
    // Always capitalize the first word
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    
    // Keep lowercase words lowercase unless they're proper nouns
    if (lowercaseWords.includes(word.toLowerCase())) {
      return word.toLowerCase();
    }
    
    // Capitalize other words (potential proper nouns or important words)
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
