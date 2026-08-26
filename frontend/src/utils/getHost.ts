import defaultFederation from '../../static/federation.json';
import { Origin } from '../models';
import { systemClient } from '../services/System';

export const getHost = function (): string {
  const url =
    window.location !== window.parent.location ? document.referrer : document.location.href;
  return url.split('/')[2];
};

/** Return a live federation document: voted manifest from cache, else the bundled seed. */
function getLiveFederation(): Record<string, Record<string, Record<string, string>>> {
  try {
    const cached = systemClient.getSyncItem?.('federation_manifest');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return parsed as Record<string, Record<string, Record<string, string>>>;
      }
    }
  } catch {
    // ignore parse errors — fall through to bundled seed
  }
  return defaultFederation as unknown as Record<string, Record<string, Record<string, string>>>;
}

export const getHostUrl = (network = 'mainnet'): string => {
  const [client] = window.RobosatsSettings.split('-');
  // For non-mobile clients the host comes from window.location, not the federation list.
  if (client !== 'mobile') {
    return `${location.protocol}//${getHost()}`;
  }
  // Mobile: pick a random onion from the live (voted) federation list.
  const liveFed = getLiveFederation();
  const aliases = Object.keys(liveFed);
  const randomAlias = aliases[Math.floor(Math.random() * aliases.length)];
  const fedEntry = liveFed[randomAlias];
  const onionUrl = fedEntry?.[network]?.['onion'];
  if (!onionUrl) {
    console.warn(
      `[getHostUrl] No onion URL found for coordinator "${randomAlias}" on network "${network}". Falling back to empty host.`,
    );
  }
  return `http://${onionUrl ?? ''}`;
};

export const getOrigin = (network = 'mainnet'): Origin => {
  const host = getHostUrl(network);
  let origin: Origin = 'onion';
  const [client] = window.RobosatsSettings.split('-');
  if (
    client === 'mobile' ||
    client === 'desktop' ||
    host.includes('.onion') ||
    host.includes(':8888')
  ) {
    origin = 'onion';
  } else if (host.includes('i2p')) {
    origin = 'i2p';
  } else {
    origin = 'clearnet';
  }

  return origin;
};

export default getHost;
