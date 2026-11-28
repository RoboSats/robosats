import { cancelOsmTile, loadOsmTileBlob, OSM_TILE_ATTRIBUTION, OSM_TILE_URL } from '../osmTiles';

describe('osm tile requests', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as typeof fetch;
  });

  it('uses the canonical OpenStreetMap tile URL and credits contributors', () => {
    expect(OSM_TILE_URL).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(OSM_TILE_ATTRIBUTION).toContain('https://www.openstreetmap.org/copyright');
    expect(OSM_TILE_ATTRIBUTION).toContain('OpenStreetMap');
  });

  it('identifies RoboSats and sends no referrer', async () => {
    const blob = new Blob(['png']);
    const controller = new AbortController();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => blob,
    });

    await expect(
      loadOsmTileBlob('https://tile.openstreetmap.org/1/0/0.png', controller.signal),
    ).resolves.toBe(blob);

    expect(fetchMock).toHaveBeenCalledWith('https://tile.openstreetmap.org/1/0/0.png', {
      headers: { 'X-Requested-With': 'RoboSats' },
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
    expect(fetchMock.mock.calls[0][1].headers['Cache-Control']).toBeUndefined();
    expect(fetchMock.mock.calls[0][1].cache).toBeUndefined();
  });

  it('rejects tiles the server refuses', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      blob: async () => new Blob(),
    });

    await expect(
      loadOsmTileBlob('https://tile.openstreetmap.org/1/0/0.png', new AbortController().signal),
    ).rejects.toThrow('OSM tile HTTP 403');
  });

  it('aborts an in-flight tile fetch and revokes its object URL', () => {
    const revoke = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const tile = {} as HTMLElement;
    const controller = new AbortController();
    const aborts = new WeakMap<HTMLElement, AbortController>([[tile, controller]]);
    const objectUrls = new WeakMap<HTMLElement, string>([[tile, 'blob:osm-tile']]);

    cancelOsmTile(tile, aborts, objectUrls);

    expect(controller.signal.aborted).toBe(true);
    expect(revoke).toHaveBeenCalledWith('blob:osm-tile');
    expect(aborts.has(tile)).toBe(false);
    expect(objectUrls.has(tile)).toBe(false);
    revoke.mockRestore();
  });
});
