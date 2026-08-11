/**
 * Instagram Graph API Client pour Calmi
 * Gère la création de conteneurs média (Stories & Reels), l'attente de traitement et la publication officielle.
 */

const META_GRAPH_VERSION = 'v21.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

/**
 * Pause asynchrone (ms)
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Crée un conteneur média Instagram (Story ou Reel)
 */
export async function createInstagramMediaContainer({
  igUserId,
  accessToken,
  videoUrl,
  mediaType = 'STORIES', // 'STORIES' ou 'REELS'
  caption = '',
  shareToFeed = true
}) {
  if (!igUserId || !accessToken || !videoUrl) {
    throw new Error("Paramètres manquants pour createInstagramMediaContainer (igUserId, accessToken, videoUrl)");
  }

  const url = new URL(`${GRAPH_BASE_URL}/${igUserId}/media`);
  url.searchParams.append('media_type', mediaType);
  url.searchParams.append('video_url', videoUrl);
  url.searchParams.append('access_token', accessToken);

  if (mediaType === 'REELS') {
    if (caption) {
      url.searchParams.append('caption', caption);
    }
    url.searchParams.append('share_to_feed', String(shareToFeed));
  }

  console.log(`📡 [Meta API] Création du conteneur ${mediaType} pour le compte ${igUserId}...`);
  const response = await fetch(url.toString(), { method: 'POST' });
  const data = await response.json();

  if (!response.ok || data.error) {
    console.error("❌ [Meta API Error - createMedia]:", data.error);
    throw new Error(data.error?.message || "Échec création conteneur média Instagram");
  }

  console.log(`✅ [Meta API] Conteneur créé : ID = ${data.id}`);
  return data.id; // containerId
}

/**
 * Attend que le conteneur vidéo soit encodé et prêt côté Meta
 */
export async function waitForMediaProcessing({
  containerId,
  accessToken,
  maxWaitSeconds = 90,
  intervalSeconds = 5
}) {
  const startTime = Date.now();
  const maxMs = maxWaitSeconds * 1000;

  console.log(`⏳ [Meta API] En attente du traitement du conteneur ${containerId}...`);

  while (Date.now() - startTime < maxMs) {
    const url = new URL(`${GRAPH_BASE_URL}/${containerId}`);
    url.searchParams.append('fields', 'status_code,status');
    url.searchParams.append('access_token', accessToken);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok || data.error) {
      console.warn("⚠️ [Meta API] Erreur lors de la vérification de statut:", data.error);
    } else {
      const statusCode = data.status_code;
      console.log(`🔄 [Meta API] Statut actuel : ${statusCode}`);

      if (statusCode === 'FINISHED') {
        console.log(`🎉 [Meta API] Traitement vidéo terminé pour ${containerId}`);
        return true;
      }
      if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
        throw new Error(`Échec du traitement vidéo Meta: ${data.status || statusCode}`);
      }
    }

    await sleep(intervalSeconds * 1000);
  }

  throw new Error(`Timeout dépassé (${maxWaitSeconds}s) lors du traitement du conteneur ${containerId}`);
}

/**
 * Publie le conteneur prêt
 */
export async function publishInstagramMedia({
  igUserId,
  containerId,
  accessToken
}) {
  const url = new URL(`${GRAPH_BASE_URL}/${igUserId}/media_publish`);
  url.searchParams.append('creation_id', containerId);
  url.searchParams.append('access_token', accessToken);

  console.log(`🚀 [Meta API] Publication du conteneur ${containerId}...`);
  const response = await fetch(url.toString(), { method: 'POST' });
  const data = await response.json();

  if (!response.ok || data.error) {
    console.error("❌ [Meta API Error - publishMedia]:", data.error);
    throw new Error(data.error?.message || "Échec de la publication du média Instagram");
  }

  console.log(`✨ [Meta API] Publication réussie ! Media ID: ${data.id}`);
  return data.id; // publishedMediaId
}

/**
 * Fonction tout-en-un pour publier une Story ou un Reel
 */
export async function publishVideoToInstagram({
  igUserId,
  accessToken,
  videoUrl,
  mediaType = 'STORIES',
  caption = '',
  shareToFeed = true
}) {
  // 1. Créer le conteneur
  const containerId = await createInstagramMediaContainer({
    igUserId,
    accessToken,
    videoUrl,
    mediaType,
    caption,
    shareToFeed
  });

  // 2. Attendre que Meta télécharge et convertisse la vidéo
  await waitForMediaProcessing({
    containerId,
    accessToken
  });

  // 3. Publier
  const publishedMediaId = await publishInstagramMedia({
    igUserId,
    containerId,
    accessToken
  });

  return {
    containerId,
    publishedMediaId,
    mediaType,
    publishedAt: new Date().toISOString()
  };
}
