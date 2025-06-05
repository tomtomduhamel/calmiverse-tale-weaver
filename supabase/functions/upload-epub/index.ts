
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
  console.log('📚 [upload-epub] Nouvelle requête de génération EPUB');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.error('❌ [upload-epub] Méthode non autorisée:', req.method);
    return new Response(
      JSON.stringify({ error: 'Méthode non autorisée' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Vérifier et créer le bucket s'il n'existe pas
    console.log('🔍 [upload-epub] Vérification de l\'existence du bucket story-files...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ [upload-epub] Erreur lors de la vérification des buckets:', bucketsError);
      throw new Error(`Erreur lors de la vérification des buckets: ${bucketsError.message}`);
    }
    
    let storyFilesBucket = buckets?.find(bucket => bucket.name === 'story-files');
    
    if (!storyFilesBucket) {
      console.log('📦 [upload-epub] Création du bucket story-files...');
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('story-files', {
        public: true,
        allowedMimeTypes: ['application/epub+zip'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error('❌ [upload-epub] Erreur lors de la création du bucket:', createError);
        throw new Error(`Impossible de créer le bucket de stockage: ${createError.message}`);
      }
      
      console.log('✅ [upload-epub] Bucket story-files créé avec succès');
      storyFilesBucket = newBucket;
    } else {
      console.log('✅ [upload-epub] Bucket story-files trouvé');
    }

    const { content, filename } = await req.json();
    
    if (!content || !filename) {
      console.error('❌ [upload-epub] Contenu ou nom de fichier manquant');
      throw new Error('Contenu ou nom de fichier manquant');
    }

    console.log('📖 [upload-epub] Génération EPUB pour:', filename);

    // Créer un vrai fichier EPUB avec structure complète
    const epubBuffer = createCompleteEpubFile(content, filename);
    console.log('📦 [upload-epub] EPUB généré, taille:', epubBuffer.byteLength, 'bytes');
    
    // Générer un nom de fichier unique avec timestamp
    const timestamp = Date.now();
    const cleanFilename = filename.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
    const epubFilename = `${cleanFilename}_${timestamp}.epub`;
    const storagePath = `epubs/${epubFilename}`;

    console.log('📤 [upload-epub] Upload vers Supabase Storage:', storagePath);

    // Uploader vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('story-files')
      .upload(storagePath, epubBuffer, {
        contentType: 'application/epub+zip',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ [upload-epub] Erreur upload:', uploadError);
      throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
    }

    console.log('✅ [upload-epub] Fichier uploadé avec succès:', uploadData);

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('story-files')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;
    
    if (!publicUrl) {
      console.error('❌ [upload-epub] Aucune URL publique générée');
      throw new Error('Impossible de générer l\'URL publique du fichier');
    }
    
    console.log('✅ [upload-epub] EPUB uploadé avec succès:', publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        filename: epubFilename,
        size: epubBuffer.byteLength,
        path: storagePath
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ [upload-epub] Erreur complète:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return new Response(
      JSON.stringify({
        error: true,
        message: error.message,
        details: error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : 'Aucun détail disponible'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function createCompleteEpubFile(htmlContent: string, title: string): Uint8Array {
  const files: { [key: string]: Uint8Array } = {};
  
  // 1. mimetype (doit être le premier fichier, non compressé)
  files['mimetype'] = new TextEncoder().encode('application/epub+zip');
  
  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  files['META-INF/container.xml'] = new TextEncoder().encode(containerXml);
  
  // 3. OEBPS/content.opf (manifest du livre)
  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>Calmiverse</dc:creator>
    <dc:language>fr</dc:language>
    <dc:identifier id="uid">calmi-${Date.now()}</dc:identifier>
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta>
  </metadata>
  <manifest>
    <item id="toc" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="toc">
    <itemref idref="content"/>
  </spine>
</package>`;
  files['OEBPS/content.opf'] = new TextEncoder().encode(contentOpf);
  
  // 4. OEBPS/toc.ncx (table des matières pour la navigation)
  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="calmi-${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(title)}</text>
  </docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel>
        <text>Histoire</text>
      </navLabel>
      <content src="content.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;
  files['OEBPS/toc.ncx'] = new TextEncoder().encode(tocNcx);
  
  // 5. OEBPS/content.xhtml (le contenu principal)
  const contentXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>${escapeXml(title)}</title>
    <style>
      body { 
        font-family: Georgia, serif; 
        font-size: 16px; 
        line-height: 1.6; 
        margin: 20px; 
        text-align: justify;
      }
      h1 { 
        text-align: center; 
        font-size: 2em; 
        margin-bottom: 30px; 
        page-break-after: always;
      }
      p { 
        margin-bottom: 15px; 
        text-indent: 1em;
      }
      .title-page { 
        text-align: center; 
        page-break-after: always; 
        padding: 50px 0; 
      }
    </style>
  </head>
  <body>
    ${htmlContent}
  </body>
</html>`;
  files['OEBPS/content.xhtml'] = new TextEncoder().encode(contentXhtml);
  
  // Créer le fichier ZIP
  return createZipFile(files);
}

function createZipFile(files: { [key: string]: Uint8Array }): Uint8Array {
  const zipData: number[] = [];
  const centralDirectory: number[] = [];
  let offset = 0;

  // Pour chaque fichier, créer l'entrée ZIP
  for (const [filename, content] of Object.entries(files)) {
    const filenameBytes = new TextEncoder().encode(filename);
    const isCompressed = filename !== 'mimetype'; // mimetype ne doit pas être compressé
    
    // En-tête du fichier local
    const localHeader = [
      0x50, 0x4b, 0x03, 0x04, // Signature
      0x14, 0x00,             // Version
      0x00, 0x00,             // Flags
      isCompressed ? 0x08 : 0x00, 0x00, // Méthode de compression (deflate ou store)
      0x00, 0x00, 0x00, 0x00, // Timestamp
      0x00, 0x00, 0x00, 0x00, // CRC32 (sera calculé)
      0x00, 0x00, 0x00, 0x00, // Taille compressée
      0x00, 0x00, 0x00, 0x00, // Taille non compressée
      ...numberToBytes(filenameBytes.length, 2), // Longueur du nom
      0x00, 0x00              // Longueur extra
    ];

    // Calculer CRC32 et mettre à jour les tailles
    const crc32 = calculateCRC32(content);
    localHeader.splice(14, 4, ...numberToBytes(crc32, 4));
    localHeader.splice(18, 4, ...numberToBytes(content.length, 4)); // Taille compressée = non compressée pour store
    localHeader.splice(22, 4, ...numberToBytes(content.length, 4)); // Taille non compressée
    
    // Ajouter l'entrée au répertoire central
    const centralEntry = [
      0x50, 0x4b, 0x01, 0x02, // Signature
      0x14, 0x00,             // Version made by
      0x14, 0x00,             // Version needed
      0x00, 0x00,             // Flags
      isCompressed ? 0x08 : 0x00, 0x00, // Méthode
      0x00, 0x00, 0x00, 0x00, // Timestamp
      ...numberToBytes(crc32, 4),        // CRC32
      ...numberToBytes(content.length, 4), // Taille compressée
      ...numberToBytes(content.length, 4), // Taille non compressée
      ...numberToBytes(filenameBytes.length, 2), // Longueur nom
      0x00, 0x00,             // Longueur extra
      0x00, 0x00,             // Longueur commentaire
      0x00, 0x00,             // Numéro disque
      0x00, 0x00,             // Attributs internes
      0x00, 0x00, 0x00, 0x00, // Attributs externes
      ...numberToBytes(offset, 4) // Offset relatif
    ];
    
    // Ajouter au ZIP
    zipData.push(...localHeader, ...filenameBytes, ...content);
    centralDirectory.push(...centralEntry, ...filenameBytes);
    
    offset += localHeader.length + filenameBytes.length + content.length;
  }

  // En-tête de fin du répertoire central
  const endRecord = [
    0x50, 0x4b, 0x05, 0x06, // Signature
    0x00, 0x00,             // Numéro de disque
    0x00, 0x00,             // Disque avec répertoire central
    ...numberToBytes(Object.keys(files).length, 2), // Nombre d'entrées sur ce disque
    ...numberToBytes(Object.keys(files).length, 2), // Nombre total d'entrées
    ...numberToBytes(centralDirectory.length, 4),   // Taille du répertoire central
    ...numberToBytes(offset, 4), // Offset du répertoire central
    0x00, 0x00              // Longueur du commentaire
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
