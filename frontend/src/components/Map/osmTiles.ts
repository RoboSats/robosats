export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const OSM_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const OSM_TILE_APP_ID = 'RoboSats';

export const osmTileRequestInit = (signal: AbortSignal): RequestInit => ({
  headers: { 'X-Requested-With': OSM_TILE_APP_ID },
  referrerPolicy: 'no-referrer',
  signal,
});

export const loadOsmTileBlob = async (url: string, signal: AbortSignal): Promise<Blob> => {
  const response = await fetch(url, osmTileRequestInit(signal));
  if (!response.ok) {
    throw new Error(`OSM tile HTTP ${response.status}`);
  }
  return response.blob();
};

export const cancelOsmTile = (
  tile: HTMLElement,
  aborts: WeakMap<HTMLElement, AbortController>,
  objectUrls: WeakMap<HTMLElement, string>,
): void => {
  aborts.get(tile)?.abort();
  aborts.delete(tile);
  const objectUrl = objectUrls.get(tile);
  if (objectUrl != null) {
    URL.revokeObjectURL(objectUrl);
    objectUrls.delete(tile);
  }
};
