/**
 * Source de vérité unique pour le chemin du lecteur d'histoire.
 * Toute navigation interne vers une histoire doit utiliser ce helper
 * pour éviter de retomber dans la route legacy `/reader/:id`.
 */
export const READER_BASE_PATH = "/app/reader";

export const getReaderPath = (storyId: string): string =>
  `${READER_BASE_PATH}/${storyId}`;

export const isReaderPathname = (pathname: string): boolean =>
  pathname.startsWith("/reader/") || pathname.startsWith("/app/reader/");
