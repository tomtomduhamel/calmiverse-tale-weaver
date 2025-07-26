
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
    
    const { content, filename, optimized = false } = await req.json();
    
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
    const epubBuffer = createOptimizedEpubFile(content, filename);
    const epubTime = Date.now() - epubStartTime;
    
    console.log(`📖 [upload-epub-${requestId}] EPUB généré en ${epubTime}ms, taille: ${epubBuffer.byteLength} bytes`);
    
    // Nom de fichier nettoyé pour affichage Kindle (SANS timestamp)
    const timestamp = Date.now();
    const cleanFilename = filename
      .replace(/^\d+_/, '') // Supprimer les chiffres au début
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const epubFilename = `${cleanFilename}.epub`;
    // Storage path avec timestamp pour éviter conflits, mais titre propre dans métadonnées
    const storagePath = `epubs/${timestamp}_${cleanFilename.replace(/\s+/g, '_')}.epub`;

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
        const fallbackPath = `epubs/${cleanFilename}_${timestamp}_${crypto.randomUUID().slice(0, 8)}.epub`;
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

function createOptimizedEpubFile(htmlContent: string, title: string): Uint8Array {
  const files: { [key: string]: Uint8Array } = {};
  
  // Nettoyer le titre pour l'affichage dans les métadonnées
  const cleanTitle = title
    .replace(/^\d+_/, '') // Supprimer les chiffres au début
    .replace(/_/g, ' ')   // Remplacer les underscores par des espaces
    .replace(/\s+/g, ' ') // Nettoyer les espaces multiples
    .trim();
  
  // 1. mimetype (non compressé selon spec EPUB)
  files['mimetype'] = new TextEncoder().encode('application/epub+zip');
  
  // 2. META-INF/container.xml (minifié)
  const containerXml = `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`;
  files['META-INF/container.xml'] = new TextEncoder().encode(containerXml);
  
  // 3. OEBPS/content.opf (minifié)
  const contentOpf = `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${escapeXml(cleanTitle)}</dc:title><dc:creator>Calmi</dc:creator><dc:language>fr</dc:language><dc:identifier id="uid">calmi-${Date.now()}</dc:identifier><meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta></metadata><manifest><item id="toc" href="toc.ncx" media-type="application/x-dtbncx+xml"/><item id="content" href="content.xhtml" media-type="application/xhtml+xml"/></manifest><spine toc="toc"><itemref idref="content"/></spine></package>`;
  files['OEBPS/content.opf'] = new TextEncoder().encode(contentOpf);
  
  // 4. OEBPS/toc.ncx (minifié)
  const tocNcx = `<?xml version="1.0"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="calmi-${Date.now()}"/></head><docTitle><text>${escapeXml(cleanTitle)}</text></docTitle><navMap><navPoint id="navpoint-1" playOrder="1"><navLabel><text>Histoire</text></navLabel><content src="content.xhtml"/></navPoint></navMap></ncx>`;
  files['OEBPS/toc.ncx'] = new TextEncoder().encode(tocNcx);
  
  // 5. OEBPS/content.xhtml (optimisé)
  const contentXhtml = `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${escapeXml(cleanTitle)}</title><style>body{font-family:Georgia,serif;font-size:16px;line-height:1.6;margin:20px}h1{text-align:center;font-size:2em;margin-bottom:30px}p{margin-bottom:15px}</style></head><body>${htmlContent}</body></html>`;
  files['OEBPS/content.xhtml'] = new TextEncoder().encode(contentXhtml);
  
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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
